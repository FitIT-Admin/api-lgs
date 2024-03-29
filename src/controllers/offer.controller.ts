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
import { OfferRepository, OrderRepository, UserRepository , ProductRepository, CompanyRepository, NotificationRepository} from '../repositories';
import { Offer, Order, User, Product, Notification, Company } from '../models';
import { ObjectId } from 'mongodb';
require('dotenv').config();
  export class OfferController {
    
    constructor(
        @repository(NotificationRepository) public notificationRepository : NotificationRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(CompanyRepository) public companyRepository: CompanyRepository,
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
        let timerVigency: number = (process.env.TIMER_VIGENCY) ? Number(process.env.TIMER_VIGENCY) : 30;
        offer.confirmedAtAdmin = null;
        offer.confirmedAtClaimant = null;
        offer.timerVigency = new Date(new Date().getTime() + timerVigency * 60000);
        offer.timerPaymentWorkshop = null;
        const product: Product = await this.productRepository.findById(offer.idProduct);
        if (product) {
          const workshop: Company[] = await this.companyRepository.find({ where: { rut: product.company }});
          const commerce: Company[] = await this.companyRepository.find({ where: { rut: offer.company }});
          // Notificación - Oferta ingresada
          if (workshop && workshop.length > 0 && commerce && commerce.length > 0) {
            var link: string = process.env.FRONTEND_URL+"/admin/orders/"+product.idOrder+"/products/view/"+product.id;
            await this.createNotifications('Web', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, 'Oferta ingresada', workshop[0].name+': Encontramos el repuesto '+product.title+' que buscabas. Revisa tu pedido en Planeta Tuercas, oferta por tiempo limitado!', link, 0, false);
            await this.createNotifications('SMS', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, 'Oferta ingresada', workshop[0].name+': Encontramos el repuesto '+product.title+' que buscabas. Revisa tu pedido en Planeta Tuercas, oferta por tiempo limitado!', link, 0, false);
            await this.createNotifications('Mail', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, 'Oferta ingresada', workshop[0].name+': Encontramos el repuesto '+product.title+' que buscabas. Revisa tu pedido en Planeta Tuercas, oferta por tiempo limitado!', link, 0, false);
          }
        }
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
        const commerce: Company[] = await this.companyRepository.find({ where: { rut: offer.company }});
        const users: User[] = await this.userRepository.find({ where: { status: 1, role: 'administrador'}});
        const product: Product = await this.productRepository.findById(offer.idProduct);
        if (commerce && commerce.length > 0 && users && users.length > 0 && product && status == 6) {
          for (let user of users) {
            var link: string = process.env.FRONTEND_URL+"/admin/users/sales-management";
            await this.createNotifications('Web', {email: user.email, rut: '', phone: ''}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone},'Pago recibido', 'Admin: el local '+commerce[0].name+' confirmó que el producto '+product.title+' está disponible para ser retirado', link, 0, false);
            await this.createNotifications('SMS', {email: user.email, rut: '', phone: ''}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone},'Pago recibido', 'Admin: el local '+commerce[0].name+' confirmó que el producto '+product.title+' está disponible para ser retirado', link, 0, false);
            await this.createNotifications('Mail', {email: user.email, rut: '', phone: ''}, { email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone},'Pago recibido', 'Admin: el local '+commerce[0].name+' confirmó que el producto '+product.title+' está disponible para ser retirado', link, 0, false);
          }
        }
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
        @param.path.number('status') status: number
    ): Promise<Offer[]> {
        const offersTemp: Offer[] = await this.offerRepository.find({where: {idProduct: new ObjectId(id), status: status}});
        for (let offer of offersTemp) {
          if ((new Date((offer.timerVigency) ? offer.timerVigency : new Date()).getTime() - new Date().getTime()) <= 0) {
            if (status === 2) {
              offer.status = -3;
              await this.offerRepository.updateById(offer.id, offer);
              console.log("Expire Offer: "+offer.company+", "+offer.createBy);
            }
          }
        }
        let offers: Offer[] = []
        let count = 0;
        for (let offer of offersTemp) {
          if (count < 5) {
            if (offer.status == 2) {
              offers.push(offer);
              count++;
            }
          } else {
            break;
          }
        }
        return (offers && offers.length > 0) ? offers : [];
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
                const product: Product = await this.productRepository.findById(offersConfirm[0].idProduct);
                for (let i = 0 ; i < offersConfirm.length ; i++) {
                  offersConfirm[i].status = 3;
                  offersConfirm[i].qtyOfferAccepted = Number(offersQty[i]);
                  if (product) {
                    offersConfirm[i].acceptedByUser = product.createBy;
                    offersConfirm[i].acceptedByCompany = product.company;
                    // Sys-Taller-Timer-Pago pendiente
                    let timerPaymentWorkshop: number = (process.env.TIMER_PAYMENT_TALLER) ? Number(process.env.TIMER_PAYMENT_TALLER) : 10;
                    offersConfirm[i].timerPaymentWorkshop = new Date(new Date().getTime() + timerPaymentWorkshop * 60000);
                  }
                  await this.offerRepository.updateById(offersConfirm[i].id, offersConfirm[i]);
                  const commerce: Company[] = await this.companyRepository.find({ where: { rut: offersConfirm[i].company }});
                  if (commerce && commerce.length > 0) {
                    var link: string = process.env.FRONTEND_URL+"/admin/orders/offers";
                    await this.createNotifications('Web', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta ingresada', commerce[0].name+': Buenas noticias, tu oferta fue aceptada! Reserva el producto a la espera del pago. Revisa tu Mesón Virtual', link, 0, false);
                    await this.createNotifications('SMS', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta ingresada', commerce[0].name+': Buenas noticias, tu oferta fue aceptada! Reserva el producto a la espera del pago. Revisa tu Mesón Virtual', link, 0, false);
                    await this.createNotifications('Mail', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta ingresada', commerce[0].name+': Buenas noticias, tu oferta fue aceptada! Reserva el producto a la espera del pago. Revisa tu Mesón Virtual', link, 0, false);
                  }
                }
                if (product) {
                    let sum: number = 0;
                    for (let i = 0 ; i < offersConfirm.length ; i++) {
                        sum+= offersConfirm[i].qtyOfferAccepted;
                    }
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
                    // rechazar ofertas que no fueron adjudicadas
                    const rejectOffers: Offer[] = await this.offerRepository.find({ where: { status: 2, idProduct: new ObjectId(product.id)}})
                    if (rejectOffers && rejectOffers.length > 0) {
                      for (let offer of rejectOffers) {
                        offer.status = -2;
                        await this.offerRepository.updateById(offer.id, offer);
                      }
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
    @authenticate('jwt')
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
    @post('/offer/sales/count/byemail/{email}')
    @response(200, {
      description: 'Offer model instance',
      content: {'application/json': {schema: getModelSchemaRef(Product)}},
    })
    @authenticate('jwt')
    async getCountSalesByEmail(
      @requestBody() parameters: {date: string, status: string},
      @param.path.string('email') email: string
    ): Promise<{count: number}> {
      try {
        let offerResult: any;
        
        const offerCollection = (this.offerRepository.dataSource.connector as any).collection("Offer");
        if (offerCollection) {
            const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
            offerResult = await offerCollection.aggregate([
              {
                '$match': {
                  'status': (parameters.status === "") ? {$in: [ 5,6,7,8 ]} : (parameters.status === "67") ? {$in: [ 6,7 ]} : Number(parameters.status),
                  'createBy' : email,
                  'createdAt': {'$gte': period.dateStart, '$lte': period.dateEnd}
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
        
        return (offerResult.length > 0) ? {count: offerResult.length} : {count: 0};
        
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador');
      }
    }
    @post('/offer/sales/byemail/{email}/skip/{skip}/limit/{limit}')
    @response(200, {
      description: 'Offer model instance',
      content: {'application/json': {schema: getModelSchemaRef(Product)}},
    })
    @authenticate('jwt')
    async getSalesByEmail(
      @requestBody() parameters: {date: string, status: string},
      @param.path.string('email') email: string,
      @param.path.number('skip') skip: number,
      @param.path.number('limit') limit: number
    ): Promise<any> {
      try {
        let offerResult: any;
        
        const offerCollection = (this.offerRepository.dataSource.connector as any).collection("Offer");
        if (offerCollection) {
            const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
            offerResult = await offerCollection.aggregate([
              {
                '$match': {
                  'status': (parameters.status === "") ? {$in: [ 5,6,7,8 ]} : (parameters.status === "67") ? {$in: [ 6,7 ]} : Number(parameters.status),
                  'createBy' : email,
                  'createdAt': {'$gte': period.dateStart, '$lte': period.dateEnd}
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
              },
              {
                '$skip': skip
              },
              {
                '$limit': limit
              }
            ]).get();
        }
        
        return (offerResult.length > 0) ? offerResult : [];
        
      } catch(error) {
        console.log(error);
        throw new HttpErrors.ExpectationFailed('Error al buscar contador');
      }
    }
    @post('/offer/byemail/{email}/skip/{skip}/limit/{limit}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByEmail(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string,
        @param.path.number('skip') skip: number,
        @param.path.number('limit') limit: number
    ): Promise<any> {
      let offerResult: any;
      const offerCollection = (this.offerRepository.dataSource.connector as any).collection("Offer");
      if (offerCollection) {
        let period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
        offerResult = await offerCollection.aggregate([
          {
            '$match': {
              'status': (parameters.status === "") ? {$in: [ -4, -3, -2, 1, 2, 3, 4 ]} : (parameters.status === "-3-4") ? {$in: [ -4, -3 ]} : Number(parameters.status),
              'createBy' : email,
              'createdAt': {'$gte': period.dateStart, '$lte': period.dateEnd}
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
            '$sort': { _id: -1 }
          },
          {
            '$skip': skip
          },
          {
            '$limit': limit
          }
        ]).get();
      }
      return (offerResult.length > 0) ? offerResult : [];
    }
    @post('/offer/count/byemail/{email}')
    @response(200, {
        description: 'Offer model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async countByEmail(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string
    ): Promise<{count: number}> {
      let period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
      var offers: Offer[] = await this.offerRepository.find(
        { 
          where: {
            and: [
              {status: (parameters.status === "") ? {inq: [-4, -3, -2, 1, 2, 3, 4]} : (parameters.status === "-3-4") ? {inq: [-4, -3 ]} : Number(parameters.status)},
              {createBy: email},
              {createdAt: {$gte: period.dateStart}},
              {createdAt: {$lte: period.dateEnd}},
            ]
          }
        }
      );
      for (let offer of offers) {
        if ((new Date((offer.timerVigency) ? offer.timerVigency : new Date()).getTime() - new Date().getTime()) <= 0) {
          if (offer.status === 2) {
            offer.status = -3;
            await this.offerRepository.updateById(offer.id, offer);
            console.log("Expire Offer: "+offer.company+", "+offer.createBy);
          }
        }
      }
      return (offers && offers.length > 0) ? { count: offers.length } : { count: 0 };
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
    @put('/offer/update/{id}', {
      responses: {
        '204': {
          description: 'Offer PUT success'
        },
      },
    })
    @authenticate('jwt')
    async updateById(
      @param.path.string('id') id: string,
      @requestBody() offer: Offer,): Promise<void> {
          const offerTemp: Offer = await this.offerRepository.findById(id);
          if (offerTemp) {
            offerTemp.estado = offer.estado;
            offerTemp.qty = offer.qty;
            offerTemp.qtyOfferAccepted = offer.qtyOfferAccepted;
            offerTemp.origen = offer.origen;
            offerTemp.price = offer.price;
            offerTemp.make = offer.make;
            offerTemp.company = offer.company;
            offerTemp.despacho = offer.despacho;
            await this.offerRepository.updateById(offerTemp.id, offerTemp);
            console.log("Update Offer: "+offerTemp.company+", "+offerTemp.createBy);
          } else {
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
          }
    }
    /**
   * Creación de una notificación estandar
   * @param channel canal de la notificación (SMS, Web, Mail, etc)
   * @param recipent datos de usuario destino
   * @param sender datos de usuario origen
   * @param title titulo de notificación
   * @param message mensaje de notificación
   * @param link puede tener un link para mayor acceso
   * @param pushAttempts contador de veces que fue envíado
   * @param send si el usuario le llego la notificación o no
   */
  private async createNotifications(channel: string, recipent: {email: string, rut: string, phone: string}, sender: {email: string, rut: string, phone: string}, title: string, message: string, link: string, pushAttempts: number, send: boolean) {
    var notification = new Notification();
    notification.channel = channel
    notification.recipient = {
      email: recipent.email,
      rut: recipent.rut,
      phone: recipent.phone
    }
    notification.sender = {
      email: sender.email,
      rut: sender.rut,
      phone: sender.phone
    }
    notification.title = title;
    notification.message = message;
    notification.link = link;
    notification.viewed = false;
    notification.viewedDate = new Date(0);
    notification.status = 0;
    notification.pushAttempts = pushAttempts;
    notification.send = send;
    await this.notificationRepository.create(notification);
  }
  private getPeriod(date: string): {dateStart: Date, dateEnd: Date} {
    let monthSelect: string = date.split(" ")[0];
    let yearSelect: string = date.split(" ")[1];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    let maxDays: number = this.daysInMonth(months.indexOf(monthSelect), Number(yearSelect))
    return {
      dateStart: new Date(yearSelect+"-"+(String(months.indexOf(monthSelect) + 1)).padStart(2, '0')+"-01T00:00:00.000Z"),
      dateEnd: new Date(yearSelect+"-"+(String(months.indexOf(monthSelect) + 1)).padStart(2, '0')+"-"+String(maxDays).padStart(2, '0')+"T23:59:59.999Z")
    }
  }
  private daysInMonth(iMonth  : number , iYear : number) {
    return 32 - new Date(iYear, iMonth, 32).getDate();
  }
}
  
  
