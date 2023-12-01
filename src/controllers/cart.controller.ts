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
import { Company, Notification, Offer, Order, User } from '../models';
import { OfferWithData } from '../interface/offer-with-data.interface';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class CartController {
    constructor(
      @repository(NotificationRepository) public notificationRepository : NotificationRepository,
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(CompanyRepository) public companyRepository: CompanyRepository,
      @repository(ProductRepository) public productRepository: ProductRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}

    @get('/cart/orders/{email}', {
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
      async findOffersInCart(
        @param.path.string('email') email: string
        ): Promise<{ order: Order, productWithOffers: {product: Product, offers: Offer[]}[]}[]> {
            try {
                const orders: Order[] = await this.orderRepository.find({where: {status: {inq: [1, 2]}, createBy: email}});
                let orderOffers: { order: Order, productWithOffers: {product: Product, offers: Offer[]}[]}[] = [];
                if (orders && orders.length > 0) {
                  for (let order of orders) {
                    const products: Product[] = await this.productRepository.find({ where: { status: { inq: [2, 3] }, idOrder: new ObjectId(order.id) } });
                    if (products && products.length > 0) {
                      orderOffers.push({
                        order: order,
                        productWithOffers: []
                      });
                      for (let product of products) {
                        const offersTemp: Offer[] = await this.offerRepository.find({ where: {status: 3, idProduct: new ObjectId(product.id)} });
                        let countOffersMax: number = offersTemp.length;
                        let countQtyOfferMax: number = product.originalQty;
                        for (let offer of offersTemp) {
                          // Sys-Taller-Timer-Pago Pendiente
                          if ((new Date((offer.timerPaymentWorkshop) ? offer.timerPaymentWorkshop : new Date()).getTime() - new Date().getTime()) <= 0) {
                            countQtyOfferMax = countQtyOfferMax - offer.qtyOfferAccepted;
                            countOffersMax--;
                            offer.status = -4;
                            await this.offerRepository.updateById(offer.id, offer);
                            console.log("Expire Offer: "+offer.company+", "+offer.createBy);
                          }
                        }
                        if (countOffersMax === 0) {
                          product.qty = product.originalQty;
                          product.status = 1;
                          await this.productRepository.updateById(product.id, product);
                        } else if (countOffersMax > 0 && countOffersMax < offersTemp.length) {
                          product.qty = countQtyOfferMax;
                          product.status = 2;
                          await this.productRepository.updateById(product.id, product);
                        }
                        let offers: Offer[] = [];
                        for (let offer of offersTemp) {
                          if (offer.status == 3) {
                            offers.push(offer);
                          }
                        }
                        if (offers && offers.length > 0) {
                          if (orderOffers.length > 0) {
                            orderOffers[orderOffers.length -1].productWithOffers.push({
                              product: product,
                              offers: offers
                            });
                          }
                        } else {
                          if (orderOffers.length > 0 && orderOffers[orderOffers.length -1].productWithOffers.length <= 0) {
                            //console.log("eliminar orderOffers");
                            orderOffers.splice(orderOffers.length -1, 1);
                          }
                        }
                      }
                    }
                    
                  }
                  return (orderOffers && orderOffers.length > 0) ? orderOffers : []
                }
                return (orderOffers && orderOffers.length > 0) ? orderOffers : [];

            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
      @post('/cart/purchases/orders/count/{email}', {
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
      async countPurchases(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string
      ): Promise<{count: number}> {
            try {
              const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
              const offers: {count: number} = await this.offerRepository.count({
                and: [
                  {acceptedByUser: email},
                  {status: (parameters.status === "45") ? {inq: [4,5]} : (parameters.status === "") ? {inq: [4, 5, 6, 7, 8]} : Number(parameters.status)},
                  {createdAt: {$gte: period.dateStart}},
                  {createdAt: {$lte: period.dateEnd}}
                ]
              });
              return (offers && offers.count) ? offers : {count: 0}
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
      @post('/cart/purchases/orders/{email}/skip/{skip}/limit/{limit}', {
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
      async findPurchases(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string
      ): Promise<OfferWithData[]> {
            try {
                let offerResult: OfferWithData[] = [];
                const offerCollection = await (this.offerRepository.dataSource.connector as any).collection("Offer");
                if (offerCollection) {
                  const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
                  offerResult = await offerCollection.aggregate([
                      {
                        '$match': {
                          'status': (parameters.status === "45") ? {'$in': [4, 5]} : (parameters.status === "") ? { '$in': [4, 5, 6, 7, 8]} : Number(parameters.status),
                          'acceptedByUser': email,
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
                          'from': 'User',
                          'localField': 'createBy',
                          'foreignField': 'email',
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
                          'from': 'User',
                          'localField': 'order.createBy',
                          'foreignField': 'email',
                          'as': 'workshop'
                        }
                      }, {
                        '$addFields': {
                          'workshop': { '$first': "$workshop" },
                        }
                      }, {
                        '$sort': { _id: -1 }
                      }
                    ]).get();
                }
                return (offerResult && offerResult.length > 0) ? offerResult : [];
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
      @put('/cart/confirmed-payment/{id}', {
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
        @param.path.string('id') id: string,
        @requestBody() photoPath: {photo: string}
      ): Promise<void> {
            try {
                const orders: Order[] = await this.orderRepository.find({where: { idOrder: id}});
                if (orders && orders.length > 0) {
                  const products: Product[] = await this.productRepository.find({ where: { status: { inq: [2, 3] }, idOrder: new ObjectId(orders[0].id) } });
                  const users: User[] = await this.userRepository.find({ where: { status: 1, role: 'administrador'}});
                  if (products && products.length > 0) {
                    for (let product of products) {
                      if (users && users.length > 0) {
                        for (let user of users) {
                          var link: string = process.env.FRONTEND_URL+"/admin/users/sales-management";
                          const workshop: Company[] = await this.companyRepository.find({where: {rut: product.company}});
                          await this.createNotifications('Web', {email: user.email, rut: '', phone: ''}, { email: '', rut: '', phone: ''},'Oferta pagada', 'Admin: has recibido un pago de '+workshop[0].name+', revisa pronto y confirma al comercio, el timer está corriendo!', link, 0, false);
                          await this.createNotifications('SMS', {email: user.email, rut: '', phone: ''}, { email: '', rut: '', phone: ''},'Oferta pagada', 'Admin: has recibido un pago de '+workshop[0].name+', revisa pronto y confirma al comercio, el timer está corriendo!', link, 0, false);
                          await this.createNotifications('Mail', {email: user.email, rut: '', phone: ''}, { email: '', rut: '', phone: ''},'Oferta pagada', 'Admin: has recibido un pago de '+workshop[0].name+', revisa pronto y confirma al comercio, el timer está corriendo!', link, 0, false);
                        }
                      }
                      // Product = Adjudicada pago completo (3) => Pagado (4)
                      if (product.status == 3) {
                        product.status = 4;
                        await this.productRepository.updateById(product.id, product);
                        const productsInCart: Product[] = await this.productRepository.find({ where: { status: {$lt: 4}, idOrder: new ObjectId(product.idOrder)} });
                        // Si no hay productos en estado 0, 1 2, 3 entonces Order = Adjudicado (2) => Pagado (3)
                        if (productsInCart && productsInCart.length == 0) {
                          const order: Order = await this.orderRepository.findById(product.idOrder);
                          order.status = 3;
                          await this.orderRepository.updateById(order.id, order);
                        }
                      // Adjudicada pago incompleto (2) => Publicado (1) Pasa a no tener ofertas en el carrito 
                      } else if (product.status == 2) {
                        product.status = 1;
                        await this.productRepository.updateById(product.id, product);
                      }
                      // Offer = Aceptada (3) => Pagada (4)
                      const offers: Offer[] = await this.offerRepository.find({ where: {status: 3, idProduct: new ObjectId(product.id)} });
                      if (offers && offers.length > 0) {
                        // IDs para cambiar de estado
                        let offersId: string[] = [];
                        for (let offer of offers) {
                          offersId.push(offer.idOffer);
                        }
                        // Definir la condición para seleccionar los registros a actualizar
                        const filter = {
                          idOffer: { $in: offersId },
                        };

                        // Definir el nuevo valor para el campo que se actualizará
                        const update: {} = { status: 4, confirmedAtClaimant: new Date(), photoPaymentReceiptAtClaimant: photoPath.photo };

                        // Ofertas adjudicadas -> Pagadas
                        await this.offerRepository.updateAll(update, filter);
                      }
                    }
                  }
                }
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
      @put('/cart/confirm-received/{id}', {
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
      async confirmProductReceived(
        @param.path.string('id') id: string
      ): Promise<void> {
            try {
              // Offer = confirmado-producto-entregado-admin (7) => confirmado-producto-entregado-taller (8)
              const offer: Offer = await this.offerRepository.findById(id);
              offer.status = 8;
              await this.offerRepository.updateById(offer.id, offer);
              const offerProduct: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(offer.idProduct), status: {inq: [3, 4, 5, 6, 7]} } });
              const product: Product = await this.productRepository.findById(offer.idProduct);
              if (offerProduct && offerProduct.length == 0 && product && product.status == 7) {
                // Product = confirmado-producto-entregado-admin (7) => confirmado-producto-entregado-taller (8)
                if (product) {
                  product.status = 8;
                  await this.productRepository.updateById(product.id, product);
                }
              }
              const productsNotConfirm: Product[] = await this.productRepository.find({ where: { idOrder: new ObjectId(offer.idOrder), status: {inq: [1, 2, 3, 4, 5, 6, 7]}}});
              if (productsNotConfirm && productsNotConfirm.length === 0) {
                const order: Order = await this.orderRepository.findById(offer.idOrder);
                if (order) {
                  order.status = 4;
                  await this.orderRepository.updateById(order.id, order);
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
  