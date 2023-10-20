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
//import {ProductRepository, UserRepository} from '../repositories';
//import {Product} from '../models';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../models/product.model';
import { ObjectId } from 'mongodb';
import { CompanyRepository, NotificationRepository, OfferRepository, OrderRepository, UserRepository } from '../repositories';
import { Notification, Offer, Order, User, Company } from '../models';
import { OfferWithData } from '../interface/offer-with-data.interface';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class DeliveryController {
    constructor(
      @repository(NotificationRepository) public notificationRepository : NotificationRepository,
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(CompanyRepository) public companyRepository: CompanyRepository,
      @repository(ProductRepository) public productRepository: ProductRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
    @post('/delivery/count/orders', {
      responses: {
          '200': {
          description: 'Offer model instance',
          content: {
              'application/json': {
              schema: getModelSchemaRef(Offer, {includeRelations: true}),
              },
          },
          },
      },
      })
      @authenticate('jwt')
      async countOrders(
        @requestBody() parameters: {date: string, status: string},
      ): Promise<{count: number}> {
          try {
              const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
              const count: {count: number} = await this.offerRepository.count({
                and: [
                  {status: (parameters.status === "") ? {inq: [6, 7, 8]} : Number(parameters.status)},
                  {createdAt: {$gte: period.dateStart}},
                  {createdAt: {$lte: period.dateEnd}}
                ]
              });
              return (count) ? count : {count: 0};
          } catch(error) {
              console.log(error);
              throw new HttpErrors.ExpectationFailed('Error al buscar por id');
          }
      }
    @post('/delivery/orders/skip/{skip}/limit/{limit}', {
    responses: {
        '200': {
        description: 'Offer model instance',
        content: {
            'application/json': {
            schema: getModelSchemaRef(Offer, {includeRelations: true}),
            },
        },
        },
    },
    })
    @authenticate('jwt')
    async findOrders(
      @requestBody() parameters: {date: string, status: string},
      @param.path.string('skip') skip: string,
      @param.path.string('limit') limit: string
    ): Promise<OfferWithData[]> {
        try {
            let offerResult: OfferWithData[] = [];
            const offerCollection = await (this.offerRepository.dataSource.connector as any).collection("Offer");
            if (offerCollection) {
              const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
              offerResult = await offerCollection.aggregate([
                  {
                    '$match': {
                      'status': (parameters.status === "") ? {'$in': [6, 7, 8]} : Number(parameters.status),
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
                    '$lookup': {
                      'from': 'Company',
                      'localField': 'company',
                      'foreignField': 'rut',
                      'as': 'commerce'
                    }
                  }, {
                    '$addFields': {
                      'product': { '$first': "$product" }, 
                      'order': { '$first': "$order" },
                      'commerce': { '$first': "$commerce" },
                    }
                  }, {
                    '$lookup': {
                      'from': 'Company',
                      'localField': 'order.company',
                      'foreignField': 'rut',
                      'as': 'workshop'
                    }
                  }, {
                    '$addFields': {
                      'workshop': { '$first': "$workshop" },
                    }
                  }, {
                    '$sort': { status: 1,_id: -1 }
                  }, {
                    '$skip': Number(skip)
                  }, {
                    '$limit': Number(limit)
                  }
                ]).get();
            }
            return (offerResult && offerResult.length > 0) ? offerResult : [];
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @get('/delivery/offer/{id}', {
      responses: {
          '200': {
          description: 'Offer model instance',
          content: {
              'application/json': {
              schema: getModelSchemaRef(Offer, {includeRelations: true}),
              },
          },
          },
      },
      })
      @authenticate('jwt')
      async findById(
        @param.path.string('id') id: string,
      ): Promise<OfferWithData | null> {
          try {
              let offerResult: OfferWithData[] = [];
              const offerCollection = await (this.offerRepository.dataSource.connector as any).collection("Offer");
              if (offerCollection) {
                offerResult = await offerCollection.aggregate([
                    {
                      '$match': {
                        '_id': new ObjectId(id)
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
                      '$lookup': {
                        'from': 'Company',
                        'localField': 'company',
                        'foreignField': 'rut',
                        'as': 'commerce'
                      }
                    }, {
                      '$addFields': {
                        'product': { '$first': "$product" }, 
                        'order': { '$first': "$order" },
                        'commerce': { '$first': "$commerce" },
                      }
                    }, {
                      '$lookup': {
                        'from': 'Company',
                        'localField': 'order.company',
                        'foreignField': 'rut',
                        'as': 'workshop'
                      }
                    }, {
                      '$addFields': {
                        'workshop': { '$first': "$workshop" },
                      }
                    }, {
                      '$sort': { status: 1,_id: -1 }
                    }
                  ]).get();
              }
              return (offerResult && offerResult.length > 0) ? offerResult[0] : null;
          } catch(error) {
              console.log(error);
              throw new HttpErrors.ExpectationFailed('Error al buscar por id');
          }
      }
    @put('/delivery/order/{order_id}/product/{product_id}/offer/{offer_id}', {
        responses: {
          '200': {
            description: 'Products model instance',
            content: {
              'application/json': {
                schema: getModelSchemaRef(Product, {includeRelations: true}),
              },
            },
          },
        },
      })
      @authenticate('jwt')
      async payOffers(
        @param.path.string('offer_id') offer_id: string,
        @param.path.string('product_id') product_id: string,
        @param.path.string('order_id') order_id: string,
        @requestBody() photoPath: {photo: string}
      ): Promise<void> {
            try {
              const offer: Offer = await this.offerRepository.findById(offer_id);
              if (offer && offer.status == 6) {
                // Offer = Pago confirmado-comercio (6) => Entregado-taller (7)
                offer.status = 7;
                if (photoPath.photo !== '') {
                  offer.photoPaymentReceiptAtAdmin = photoPath.photo;
                }
                offer.confirmedAtAdmin = new Date();
                await this.offerRepository.updateById(offer.id, offer);
                const offerProduct: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(product_id), status: 6} });
                const workshop: Company[] = await this.companyRepository.find({ where: { rut: offer.company}});
                const product: Product = await this.productRepository.findById(product_id);
                if (workshop && workshop.length > 0) {
                  var link: string = process.env.FRONTEND_URL+"/admin/orders/sales";
                  await this.createNotifications('Web', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                  await this.createNotifications('SMS', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                  await this.createNotifications('Mail', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                }
                if (offerProduct && offerProduct.length == 0 && product && product.status == 6) {
                  // Product = Pago confirmado-comercio (6) => Entregado-taller (7)
                  product.status = 7;
                  await this.productRepository.updateById(product.id, product);
                }
              }
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
      @put('/delivery/offer/withdrawal/{id}', {
        responses: {
          '200': {
            description: 'Products model instance',
            content: {
              'application/json': {
                schema: getModelSchemaRef(Product, {includeRelations: true}),
              },
            },
          },
        },
      })
      @authenticate('jwt')
      async withdrawalProduct(
        @param.path.string('id') id: string,
      ): Promise<void> {
            try {
              const offer: Offer = await this.offerRepository.findById(id);
              if (offer && offer.status == 6) {
                // Offer = Pago confirmado-comercio (6) => confirmado-producto-entregado-admin (7)
                offer.status = 7;
                await this.offerRepository.updateById(offer.id, offer);
                const offerProduct: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(offer.idProduct), status: {inq: [1, 2, 3, 4, 5, 6]}} });
                const workshop: Company[] = await this.companyRepository.find({ where: { rut: offer.acceptedByUser}});
                const product: Product = await this.productRepository.findById(offer.idProduct);
                if (workshop && workshop.length > 0) {
                  var link: string = process.env.FRONTEND_URL+"/admin/orders/sales";
                  await this.createNotifications('Web', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                  await this.createNotifications('SMS', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                  await this.createNotifications('Mail', {email: workshop[0].createBy, rut: workshop[0].rut, phone: workshop[0].phone}, { email: '', rut: '', phone: ''}, 'Producto entregado', workshop[0].name+': has recibido el producto '+product.title+'? ingresa y confirma!', link, 0, false);
                }
                if (offerProduct && offerProduct.length == 0 && product && product.status == 6) {
                  // Product = Pago confirmado-comercio (6) => confirmado-producto-entregado-admin (7)
                  product.status = 7;
                  await this.productRepository.updateById(product.id, product);
                }
              }
            } catch(error) {
                console.log(error);
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