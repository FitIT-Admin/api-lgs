import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
  } from '@loopback/repository';
  import {
    post,
    param,
    get,
    HttpErrors,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
  } from '@loopback/rest';
  import {authenticate} from '@loopback/authentication';
  import { ServiceRepository } from '../repositories/service.repository';
  import { Service } from '../models/service.model';
import { OfferRepository, OrderRepository, UserRepository } from '../repositories';
import { Company } from '../models/company.model';
import { User } from '../models';
  export class CompanyController {
    
    constructor(
      @repository(ServiceRepository) public serviceRepository : ServiceRepository,
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
      /**
       * Crea un nuevo company para el usuario:
       * @param user user con un company nuevo dentro del array companies
       * @returns true en el caso en que el rut no este repetido, si es asi devuelve un error.
       */
    @put('/companies', {
      responses: {
        '204': {
          description: 'User PUT success',
        },
      },
    })
    @authenticate('jwt')
    async create(
      @requestBody() user: User
    ): Promise<any> {
        // buscar usuario con todas las companies 
        const allCompaniesUser = await this.userRepository.find({where: {email: user.email}});
        // buscar usuario con todas las companies distintos de -1
        const usersCollection = await (this.userRepository.dataSource.connector as any).collection("User");
        const query = [{
          $match: {
              email: user.email
            }
        }, {
          $project: {
              _id: 1,
              createdAt: 1,
              updatedAt: 1,
              email: 1,
              role: 1,
              lastName: 1,
              secondLastName: 1,
              name: 1,
              failedAttempts: 1,
              status: 1,
              companies: {
                  $filter: {
                      input: '$companies',
                      cond: {
                          $ne: [
                              '$$companies.status',
                              -1
                          ]
                      },
                      as: 'companies'
                  }
              }
          }
      }]
      const users = await usersCollection.aggregate(query).get();
        // revisar si el rut de la empresa esta registrado en el sistema
        let searchRut = await this.userRepository.find(
          {
            where:{
              companies: { 
                $elemMatch: {
                  rut: user.companies[users[0].companies.length].rut,
                  status: 1
                } 
              }
            }
          }
        );
        // si es igual a 0 entonces no esta registrado
        if (searchRut.length == 0) {
          allCompaniesUser[0].companies.push(
            {
                rut: user.companies[users[0].companies.length].rut,
                name: user.companies[users[0].companies.length].name,
                direction: user.companies[users[0].companies.length].direction,
                phone: user.companies[users[0].companies.length].phone,
                accountNumber: user.companies[users[0].companies.length].accountNumber,
                accountType: user.companies[users[0].companies.length].accountType,
                bank: user.companies[users[0].companies.length].bank,
                status: 1
            }
            
          )
          // Cambiar status a 1 si el usuario posee al menos una compañia
          allCompaniesUser[0].status = 1;
          await this.userRepository.updateById(allCompaniesUser[0].id, allCompaniesUser[0]);
          return true;
        } else {
          throw new HttpErrors.Unauthorized("rut repetido");    
        }
        
    }
    /**
     * Actualiza o Edita un company:
     * @param rut rut de company que se quiere editar
     * @param user user con cambios de company
     * @returns true en el caso de que se modificara correctamente el company
     */
    @put('/companies/update/{rut}', {
      responses: {
        '204': {
          description: 'User PUT success',
        },
      },
    })
    @authenticate('jwt')
    async update(
      @param.path.string('rut') rut: string,
      @requestBody() user: User
    ): Promise<any> {
        // buscar usuario
        const users = await this.userRepository.find({ where : { email : user.email}});
        // buscar company 
        let company  = user.companies.filter(company => company.rut === rut);
        // editar company igual al rut y distinto de -1
        for(let i=0; i < users[0].companies.length ; i++) {
          if (users[0].companies[i].rut == rut && users[0].companies[i].status != -1) {
            users[0].companies[i].name = company[0].name;
            users[0].companies[i].direction = company[0].direction;
            users[0].companies[i].phone = company[0].phone;
            users[0].companies[i].accountNumber = company[0].accountNumber;
            users[0].companies[i].accountType = company[0].accountType;
            users[0].companies[i].bank = company[0].bank;
            break;
          }
        }
        await this.userRepository.updateById(users[0].id, users[0]);
        return true;
    }
    /**
     * Buscar companies count
     * @param id email de usuario
     * @returns la cantidad de companies que tiene el user
     */
    @get('/companies/count/{id}')
    @response(200, {
      description: 'Company model count',
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async count(
        @param.path.string('id') id: string
    ): Promise<any> {
      const users = await (this.userRepository.dataSource.connector as any).collection("User");
      const query = [{
          $match: {
              email: id
          }
      }, {
          $project: {
              _id: 0,
              createdAt: 1,
              updatedAt: 1,
              email: 1,
              role: 1,
              lastName: 1,
              secondLastName: 1,
              name: 1,
              failedAttempts: 1,
              status: 1,
              companies: {
                  $filter: {
                      input: '$companies',
                      cond: {
                          $ne: [
                              '$$companies.status',
                              -1
                          ]
                      },
                      as: 'companies'
                  }
              }
          }
      }]
      const user = await users.aggregate(query).get();
      //console.log(user);
      if (user[0]) {
          return user[0].companies.length;
      }
      return 0;
    }
    /**
     * Buscar companies:
     * @param id email de usuario
     * @returns user con companies distintos de status -1
     */
    @get('/companies/{id}')
    @response(200, {
      description: 'Array of Company model instances',
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async find(
        @param.path.string('id') id: string
    ): Promise<any> {
      const users = (this.userRepository.dataSource.connector as any).collection("User");
      const query = [{
          $match: {
              email: id
          }
      }, {
          $project: {
              _id: 0,
              createdAt: 1,
              updatedAt: 1,
              email: 1,
              role: 1,
              lastName: 1,
              secondLastName: 1,
              name: 1,
              failedAttempts: 1,
              status: 1,
              companies: {
                  $filter: {
                      input: '$companies',
                      cond: {
                          $ne: [
                              '$$companies.status',
                              -1
                          ]
                      },
                      as: 'companies'
                  }
              }
          }
      }]
      const user = await users.aggregate(query).get();
      //console.log(user[0]);
      if (user[0]) {
          return user[0];
      }
      return 0;
    }
    /**
     * Eliminar company:
     * @param id email de usuario
     * @param rut rut de company
     * @returns true en el caso en que se eliminara correctamente
     */
    @put('/companies/{id}/{rut}')
    @response(204, {
      description: 'Company DELETE success',
    })
    @authenticate('jwt')
    async deleteById(
        @param.path.string('id') id: string,
        @param.path.string('rut') rut: string
    ): Promise<any> {
        const users = await this.userRepository.find({ where : { email : id}});
        // eliminar company igual al rut y distinto de -1
        for (let i=0; i < users[0].companies.length ; i++) {
            if (users[0].companies[i].rut == rut && users[0].companies[i].status != -1) {
                users[0].companies[i].status = -1;
                // Eliminar Orders/Offers
                if (users[0].role == 'taller') {
                  const orders = await this.orderRepository.find({where: {createBy: users[0].email, company: users[0].companies[i].rut}});
                  if (orders.length > 0) {
                    for(let j=0; j < orders.length ; j++) {
                      orders[j].status = -1;
                      await this.orderRepository.updateById(orders[j].id, orders[j]);
                    }
                  }
                } else if(users[0].role == 'comercio') {
                  const offers = await this.offerRepository.find({where: {createBy: users[0].email, company: users[0].companies[i].rut}});
                  if (offers.length > 0) {
                    for(let j=0; j < offers.length ; j++) {
                      offers[j].status = -1;
                      await this.offerRepository.updateById(offers[j].id, offers[j]);
                    }
                  }
                }
                break;
            }
        }
        const usersCollection = await (this.userRepository.dataSource.connector as any).collection("User");
        const query = [{
          $match: {
              email: users[0].email
            }
        }, {
          $project: {
              _id: 1,
              createdAt: 1,
              updatedAt: 1,
              email: 1,
              role: 1,
              lastName: 1,
              secondLastName: 1,
              name: 1,
              failedAttempts: 1,
              status: 1,
              companies: {
                  $filter: {
                      input: '$companies',
                      cond: {
                          $ne: [
                              '$$companies.status',
                              -1
                          ]
                      },
                      as: 'companies'
                  }
              }
          }
      }]
      const user = await usersCollection.aggregate(query).get();
      // Si el usuario no tiene compañias se le asigna status = 0
      if (user[0].companies.length == 0) {
        users[0].status = 0;
      }
      await this.userRepository.updateById(users[0].id, users[0]);
      return true;
    }
    /**
     * Buscar status de user:
     * Se creo esta funcion para que el sistema conozca el status del usuario mientras se mueve dentro de la página
     * @param email email de usuario
     * @returns el status del usuario
     */
    @get('/status/user/{email}', {
      responses: {
        '204': {
          description: 'User GET success',
        },
      },
    })
    @authenticate('jwt')
    async searchStatusUser(
      @param.path.string('email') email: string
    ): Promise<any> {
        const user = await this.userRepository.find({ where : { email : email}});
        return user[0].status;
    }
  }
  
  