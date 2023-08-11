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
        offer.confirmedAtAdmin = null;
        offer.confirmedAtClaimant = null;
        return await this.offerRepository.create(offer);
    }
    
    @post('/offer/update/{id}/{status}')
    @response(204, {
        description: 'Offer PUT success',
    })
    @authenticate('jwt')
    async replaceByStatusId(
        @param.path.string('id') id: string,
        @param.path.string('status') status: number,
    ): Promise<any> {
        
      try {
        
        const offer: Offer = await this.offerRepository.findById(id);
        offer.status = status;
        await this.offerRepository.replaceById(id, offer);
        
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al actualizar oferta');
      }   
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
    ): Promise<Offer[]> {
        const offer: Offer[] = await this.offerRepository.find({where: {idProduct: new ObjectId(id), status: status}, limit: 5});
        return offer;
    }
    @put('/offer/all/{ids}/{qty}')
    @response(204, {
        description: 'Order PUT success',
    })
    @authenticate('jwt')
    async replaceAllByIds(
        @param.path.string('ids') ids: string,
        @param.path.string('qty') qty: string,
    ): Promise<void> {
        try {
            
            // Offer = Vigente (2) => Aceptada (3)
            let offersId: string[] = ids.split(',');
            let offersQty: string[] = qty.split(',');
            const offersConfirm: Offer[] = await this.offerRepository.find({ where: { idOffer: { $in: offersId } } });
            /*// Definir la condición para seleccionar los registros a actualizar
            const filter = {
                idOffer: { $in: offersId },
            };

            // Definir el nuevo valor para el campo que se actualizará
            const update: {} = { status: 3 };
            console.log(await this.offerRepository.updateAll(update, filter));*/

            
            if (offersConfirm &&  offersConfirm.length > 0) {
                for (let i = 0 ; i < offersConfirm.length ; i++) {
                  offersConfirm[i].status = 3;
                  offersConfirm[i].qtyOfferAccepted = Number(offersQty[i]);
                  await this.offerRepository.updateById(offersConfirm[i].id, offersConfirm[i]);
                }
                const product: Product = await this.productRepository.findById(offersConfirm[0].idProduct);
                if (product) {
                    let sum: number = 0;
                    for (let i = 0 ; i < offersConfirm.length ; i++) {
                        sum+= offersConfirm[i].qtyOfferAccepted;
                    }
                    console.log(sum);
                    console.log(product.qty);
                    // si la cantidad de productos ofertados supera la cantidad pedida, entonces Product = Publicado (1) / Adjudicado incompleto (2) => Adjudicado completo (3)
                    if (product.qty <= sum) {
                        product.qty = 0;
                        product.status = 3;
                        await this.productRepository.updateById(product.id, product);
                        const productsInCart: Product[] = await this.productRepository.find({ where: { status: {$lt: 3}, idOrder: new ObjectId(product.idOrder)} });
                        // Si no hay productos en estado 0, 1 o 2 entonces Order = Publicado (1) => Adjudicado (2)
                        if (productsInCart && productsInCart.length == 0) {
                          const order: Order = await this.orderRepository.findById(product.idOrder);
                          order.status = 2;
                          await this.orderRepository.updateById(order.id, order);
                        }
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
        //const allCompaniesOffer = await this.offerRepository.find({where: { status: {$ne: -1},company:{$in:comp}}});
        //return allCompaniesOffer;
        
        let offerResult: any;
        
        const offerCollection = (this.offerRepository.dataSource.connector as any).collection("Offer");
        if (offerCollection) {
        
            offerResult = await offerCollection.aggregate([
              {
                '$match': {
                  'status': {$ne: -1},
                  'company': {$in:comp}
                }
              }, {
                '$lookup': {
                  'from': 'Product',
                  'localField': 'idProduct',
                  'foreignField': '_id',
                  'as': 'product'
                }
              }, {
                '$lookup': {
                  'from': 'Order',
                  'localField': 'idOrder',
                  'foreignField': '_id',
                  'as': 'order'
                }
              }, {
                '$addFields': {
                  'product': { '$first': "$product" }, 'order': { '$first': "$order" },"id":"$_id"
                }
              }, 
                {
                '$sort': { _id: 1 }
              }
            ]).get();
        }
        
        return (offerResult.length > 0) ? offerResult : [];
        
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador');
      }
    }
    
    @post('/offer/active/byemail/')
    @response(200, {
      description: 'Offer model instance',
      content: {'application/json': {schema: getModelSchemaRef(Product)}},
    })
    async getByCompaniesAndEmail(
      @requestBody() body:any
    ): Promise<any> {
      try {
        let email = body.email;
        let companies = body.companies;
        let comp:any = [];
        
        for(let i=0;i<companies.length;i++){
            comp.push(companies[i]);
        } 
    
        let offerResult: any;
        
        const offerCollection = (this.offerRepository.dataSource.connector as any).collection("Offer");
        if (offerCollection) {
        
            offerResult = await offerCollection.aggregate([
              {
                '$match': {
                  'status': {$in: [ 5,6 ]},
                  'company': {$in:comp},
                  'createBy' : email
                }
              }, {
                '$lookup': {
                  'from': 'Product',
                  'localField': 'idProduct',
                  'foreignField': '_id',
                  'as': 'product'
                }
              }, {
                '$lookup': {
                  'from': 'Order',
                  'localField': 'idOrder',
                  'foreignField': '_id',
                  'as': 'order'
                }
              }, {
                '$addFields': {
                  'product': { '$first': "$product" }, 'order': { '$first': "$order" },"id":"$_id"
                }
              }, 
                {
                '$sort': { _id: 1 }
              }
            ]).get();
        }
        
        return (offerResult.length > 0) ? offerResult : [];
        
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador');
      }
    }
    @get('/offer/byid/{id}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByRealId(
        @param.path.string('id') id: string
    ): Promise<any> {

        const offer = await this.offerRepository.findById(id);
        const product = await this.productRepository.findById(offer.idProduct);
        const order = await this.orderRepository.findById(offer.idOrder);

        return {"offer":offer,"product":product,"order":order};
    
    }
  }
  
  
