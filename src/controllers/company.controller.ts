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
import { CompanyRepository, OfferRepository, OrderRepository, trxLogsRepository, UserRepository } from '../repositories';
import { Company } from '../models/company.model';
import { Offer, trxLogs, User } from '../models';
  export class CompanyController {
    
    constructor(
      @repository(CompanyRepository) public companyRepository : CompanyRepository,
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(trxLogsRepository) public trxLogsRepository: trxLogsRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}

    @post('/company')
    @response(200, {
        description: 'Company model instance'
    })
    @authenticate('jwt')
    async create(
    @requestBody({
        content: {
            'application/json': {
            schema: getModelSchemaRef(Company, {
                title: 'NewCompany',
                exclude: ['id'],
                }),
            },
        },
    })
    company: Omit<Company, 'id'>,
    ): Promise<Company> {
      var user: User[] = await this.userRepository.find({where: {email: company.createBy}});
      if (user && user.length > 0) {
        const searchCompany: Company[] = await this.companyRepository.find({where: {rut: company.rut}});
        if (!searchCompany || searchCompany.length <= 0) {
          user[0].status = 1;
          await this.userRepository.updateById(user[0].id, user[0]);
          await this.companyRepository.create(company);
          const companyTemp: Company[] = await this.companyRepository.find({where: {rut: company.rut}});
          await this.createTrxLog(companyTemp[0], null, "create");
          return companyTemp[0];
        } else {
          throw new HttpErrors.Unauthorized('rut repetido');
        }
      } else {
        throw new HttpErrors.Unauthorized('Usuario no se encuentra en el sistema');
      }
    }
    @get('/companies/count/{email}')
    @response(200, {
      description: 'Company model count',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Company, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async count(
        @param.path.string('email') email: string
    ): Promise<number> {
      try {
        const companies: {count: number} = await this.companyRepository.count({createBy: email, status: {$ne: -1}});
        return (companies) ? companies.count : 0;
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador de Company');
      }
    }
    @get('/companies/byemail/{email}')
    @response(200, {
      description: 'Array of Company model instances',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Company, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async findByEmail(
        @param.path.string('email') email: string
    ): Promise<Company[]> {
      try {
        const companies: Company[] = await this.companyRepository.find({where: {createBy: email, status: {$ne: -1}}});
        return (companies && companies.length > 0) ? companies : [];
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar Companies');
      }
    }
    @get('/companies/{id}')
    @response(200, {
      description: 'Array of Company model instances',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Company, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async find(
        @param.path.string('id') id: string
    ): Promise<Company | null> {
      try {
        const companies: Company = await this.companyRepository.findById(id);
        return (companies) ? companies : null;
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar Companies');
      }
    }
    @get('/companies/brands/{email}')
    @response(200, {
      description: 'Array of Company model instances',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Company, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async findBrandOfCompanies(
        @param.path.string('email') email: string
    ): Promise<string[]> {
      try {
        const companies: Company[] = await this.companyRepository.find({where: {createBy: email}});
        let brands: string[] = [];
        for (let company of companies) {
          for (let make of company.make) {
            if (brands.length > 0) {
              // Busca si el elemento "make" existe dentro del arreglo "brands"
              if (!brands.includes(make)) {
                brands.push(make);
              }
            } else {
              brands.push(make);
            }
          }
        }
        return (brands && brands.length > 0) ? brands : [];
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar Companies');
      }
    }
    @get('/companies/byemail/{email}/byrut/{rut}')
    @response(200, {
      description: 'Array of Company model instances',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Company, {includeRelations: true}),
        }
      }
    })
    @authenticate('jwt')
    async findByEmailAndRut(
        @param.path.string('email') email: string,
        @param.path.string('rut') rut: string
    ): Promise<Company[]> {
      try {
        const companies: Company[] = await this.companyRepository.find({where: {createBy: email, rut: rut}});
        return (companies && companies.length > 0) ? companies : [];
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar Companies');
      }
    }
    @get('/status/user/{email}', {
      responses: {
        '200': {
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
    @put('/companies/update/{id}', {
      responses: {
        '204': {
          description: 'Company PUT success',
        },
      },
    })
    @authenticate('jwt')
    async replaceById(
      @param.path.string('id') id: string,
      @requestBody() company: Company,
    ): Promise<void> {
      const companyTemp: Company = await this.companyRepository.findById(id);
      if (companyTemp.rut === company.rut) {
        await this.createTrxLog(company, companyTemp, "update");
        companyTemp.name = company.name;
        if (company.billingType) {
          companyTemp.billingType = company.billingType;
        }
        companyTemp.type = company.type;
        companyTemp.direction = company.direction;
        companyTemp.region = company.region;
        companyTemp.commune = company.commune;
        companyTemp.phone = company.phone;
        companyTemp.accountNumber = company.accountNumber;
        companyTemp.accountType = company.accountType;
        companyTemp.bank = company.bank;
        companyTemp.make = company.make;
        await this.companyRepository.updateById(companyTemp.id, companyTemp);
        console.log("Update Company: "+companyTemp.rut+", "+companyTemp.name);
      } else {
        const searchCompany: Company[] = await this.companyRepository.find({ where: { rut: company.rut} });
        if (searchCompany && searchCompany.length > 0) {
          throw new HttpErrors.ExpectationFailed('rut repetido');
        } else {
          await this.createTrxLog(company, companyTemp, "update");
          companyTemp.rut = company.rut;
          if (company.billingType) {
            companyTemp.billingType = company.billingType;
          }
          companyTemp.name = company.name;
          companyTemp.type = company.type;
          companyTemp.direction = company.direction;
          companyTemp.region = company.region;
          companyTemp.commune = company.commune;
          companyTemp.phone = company.phone;
          companyTemp.accountNumber = company.accountNumber;
          companyTemp.accountType = company.accountType;
          companyTemp.bank = company.bank;
          companyTemp.make = company.make;
          await this.companyRepository.updateById(companyTemp.id, companyTemp);
          console.log("Update Company: "+companyTemp.rut+", "+companyTemp.name);
        }
      }
    }
    @put('/companies/delete/{id}', {
      responses: {
        '204': {
          description: 'Company PUT success',
        },
      },
    })
    @authenticate('jwt')
    async deleteById(
      @param.path.string('id') id: string,
    ): Promise<void> {
      const companyTemp: Company = await this.companyRepository.findById(id);
      const offers: Offer[] = await this.offerRepository.find({ where: { acceptedByCompany: companyTemp.rut, status: { inq: [3, 4] } }});
      if (offers && offers.length > 0) {
        throw new HttpErrors.ExpectationFailed('ofertas pendientes');
      } else {
        companyTemp.status = -1;
        await this.companyRepository.updateById(companyTemp.id, companyTemp);
        console.log("Delete Company: "+companyTemp.rut+", "+companyTemp.name);
      }
    }
    private async createTrxLog(companyNew: Company, companyPre: Company | null, type: string) {
      if (type === "update" && companyPre) {
        let makesNew: string = ""
        let makesPre: string = ""
        if (companyNew.make && companyNew.make.length > 0) {
          for (let make of companyNew.make) {
            makesNew = makesNew + make + " ";
          }
        } else {
          makesNew = "no tiene";
        }
        if (companyPre.make && companyPre.make.length > 0) {
          for (let make of companyPre.make) {
            makesPre = makesPre + make + " ";
          }
        } else {
          makesPre = "no tiene";
        }
        let trxLog: trxLogs = new trxLogs();
        trxLog.createdAt = new Date().toISOString();
        trxLog.updatedAt = new Date().toISOString();
        trxLog.trxType = "UpdateBillingType";
        trxLog.module = "UsersWeb";
        trxLog.userId = companyNew.createBy;
        trxLog.details = "createdAtNew:"+companyNew.createdAt+",updatedAtNew:"+companyNew.updatedAt+",rutNew:"+companyNew.rut+",billingTypeNew:"+companyNew.billingType
        +",nameNew:"+companyNew.name+",typeNew:"+companyNew.type+",createByNew:"+companyNew.createBy+",directionNew:"+companyNew.direction+",regionNew:"
        +companyNew.region+",communeNew:"+companyNew.commune+",phoneNew:"+companyNew.phone+",accountNumberNew:"+companyNew.accountNumber+
        ",accountTypeNew:"+companyNew.accountType+",bankNew:"+companyNew.bank+",makeNew:"+makesNew+",statusNew:"+companyNew.status
        +
        "createdAtPre:"+companyPre.createdAt+",updatedAtPre:"+companyPre.updatedAt+",rutPre:"+companyPre.rut+",billingTypePre:"+companyPre.billingType
        +",namePre:"+companyPre.name+",typePre:"+companyPre.type+",createByPre:"+companyPre.createBy+",directionPre:"+companyPre.direction+",regionPre:"
        +companyPre.region+",communePre:"+companyPre.commune+",phonePre:"+companyPre.phone+",accountNumberPre:"+companyPre.accountNumber+
        ",accountTypePre:"+companyPre.accountType+",bankPre:"+companyPre.bank+",makePre:"+makesPre+",statusPre:"+companyPre.status;
        trxLog.logLevel = "info";
        await this.trxLogsRepository.create(trxLog);
      } else if (type === "create") {
        let makes: string = ""
        if (companyNew.make && companyNew.make.length > 0) {
          for (let make of companyNew.make) {
            makes = makes + make + " ";
          }
        } else {
          makes = "no tiene";
        }
        let trxLog: trxLogs = new trxLogs();
        trxLog.createdAt = new Date().toISOString();
        trxLog.updatedAt = new Date().toISOString();
        trxLog.trxType = "CreateBillingType";
        trxLog.module = "UsersWeb";
        trxLog.userId = companyNew.createBy;
        trxLog.details = "createdAt:"+companyNew.createdAt+",updatedAt:"+companyNew.updatedAt+",rut:"+companyNew.rut+",billingType:"+companyNew.billingType
        +",name:"+companyNew.name+",type:"+companyNew.type+",createBy:"+companyNew.createBy+",direction:"+companyNew.direction+",region:"+companyNew.region+",commune:"
        +companyNew.commune+",phone:"+companyNew.phone+",accountNumber:"+companyNew.accountNumber+",accountType:"+companyNew.accountType+",bank:"+
        companyNew.bank+",make:"+makes+",status:"+companyNew.status;
        trxLog.logLevel = "info";
        await this.trxLogsRepository.create(trxLog);
      }
    }
  }
  
  