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
import { OfferRepository, OrderRepository, UserRepository , ProductRepository} from '../repositories';
import { Company } from '../models/company.model';
import { Offer, Order, User, Product } from '../models';
import { ObjectId } from 'mongodb';
  export class OfferController {
    
    constructor(
        @repository(ServiceRepository) public serviceRepository : ServiceRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(OrderRepository) public orderRepository: OrderRepository,
        @repository(ProductRepository) public productRepository: ProductRepository,
        @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
      
    @post('/offer')
    @response(200, {
        description: 'Offer model instance'
    })
    @authenticate('jwt')
    async create(
    @requestBody({
        content: {
            'application/json': {
            schema: getModelSchemaRef(Offer, {
                title: 'NewOffer',
                exclude: ['id'],
                }),
            },
        },
    })
    offer: Omit<Offer, 'id'>,
    ): Promise<Offer> {
        return await this.offerRepository.create(offer);
    }
    
    @put('/offer/{id}')
    @response(204, {
        description: 'Offer PUT success',
    })
    @authenticate('jwt')
    async replaceById(
        @param.path.string('id') id: string,
        @requestBody() offer: Offer,
    ): Promise<void> {
        await this.offerRepository.replaceById(id, offer);
    }
    @get('/offer/{email}/{rut}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByRut(
        @param.path.string('email') email: string,
        @param.path.string('rut') rut: string,
    ): Promise<any> {
        const offer = await this.orderRepository.find({where: {createBy: email, company: rut}});
        console.log(offer);
        return offer;
    
    }
    @get('/offer/{email}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async find(
        @param.path.string('email') email: string
    ): Promise<any> {
        const offer = await this.orderRepository.find({where: {createBy: email}});
        console.log(offer);
        return offer;
    
    }
    @get('/offer/order/{id}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByIdOrder(
        @param.path.string('id') id: string
    ): Promise<any> {
        const offer = await this.offerRepository.find({where: {idOrder: new ObjectId(id), status: {$ne: -1}}});
        console.log(offer);
        return offer;
    
    }
    @get('/offer/order/{id}/status/{status}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByIdOrderAndStatus(
        @param.path.string('id') id: string,
        @param.path.number('status') status: string
    ): Promise<any> {
        const offer = await this.offerRepository.find({where: {idOrder: new ObjectId(id), status: status}});
        console.log(offer);
        return offer;
    
    }
    @get('/offer/product/{id}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByIdProduct(
        @param.path.string('id') id: string
    ): Promise<any> {
        const offer = await this.offerRepository.find({where: {idProduct: new ObjectId(id), status: {$ne: -1}}});
        console.log(offer);
        return offer;
    
    }
    @get('/offer/product/{id}/status/{status}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByIdProductAndStatus(
        @param.path.string('id') id: string,
        @param.path.number('status') status: string
    ): Promise<any> {
        const offer = await this.offerRepository.find({where: {idProduct: new ObjectId(id), status: status}});
        console.log(offer);
        return offer;
    
    }
    @put('/offer/all/{ids}')
    @response(204, {
        description: 'Order PUT success',
    })
    @authenticate('jwt')
    async replaceAllByIds(
        @param.path.string('ids') ids: string,
    ): Promise<void> {
        try {
            let offersId: string[] = ids.split(',');
            // Definir la condición para seleccionar los registros a actualizar
            const filter = {
                idOffer: { $in: offersId },
            };

            // Definir el nuevo valor para el campo que se actualizará
            const update: {} = { status: 3 };

            console.log(await this.offerRepository.updateAll(update, filter));

            const offersConfirm: Offer[] = await this.offerRepository.find({ where: { idOffer: { $in: offersId } } })
            if (offersConfirm &&  offersConfirm.length > 0) {
                const product: Product = await this.productRepository.findById(offersConfirm[0].idProduct);
                if (product) {
                    let sum: number = 0;
                    for (let i = 0 ; i < offersConfirm.length ; i++) {
                        sum+= offersConfirm[i].cantidad;
                    }
                    console.log(sum);
                    console.log(product.qty);
                    if (product.qty <= sum) {
                        product.qty = 0;
                        product.status = 3;
                        await this.productRepository.updateById(product.id, product);
                    } else {
                        product.status = 2;
                        product.qty = product.qty - sum;
                        await this.productRepository.updateById(product.id, product);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    @del('/offer/delete/{id}')
    @response(204, {
      description: 'Offer DELETE success',
    })
    @authenticate('jwt')
    async deleteById(
        @param.path.string('id') id: string
    ): Promise<boolean> {
        const offer: Offer = await this.offerRepository.findById(id);
        offer.status = -1;
        await this.offerRepository.replaceById(offer.id, offer);
        return true;
    }
      
    @post('/offer/active/')
    @response(200, {
      description: 'Offer model instance',
      content: {'application/json': {schema: getModelSchemaRef(Product)}},
    })
    async getByCompanies(
      @requestBody() companies: []
    ): Promise<any> {
      try {
        let comp:any = [];
        for(let i=0;i<companies.length;i++){
            comp.push(companies[i]);
        }
        const allCompaniesOffer = await this.offerRepository.find({where: { status: {$ne: -1},company:{$in:comp}}});
        return allCompaniesOffer;
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador');
      }
    }   
  }
  
  
