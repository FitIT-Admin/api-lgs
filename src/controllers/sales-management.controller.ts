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
  
  
  export class SalesManagementController {
    constructor(
      @repository(NotificationRepository) public notificationRepository : NotificationRepository,
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(CompanyRepository) public companyRepository: CompanyRepository,
      @repository(ProductRepository) public productRepository: ProductRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
    @get('/sales-management/orders', {
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
    ): Promise<OfferWithData[]> {
        try {
            let offerResult: OfferWithData[] = [];
            const offerCollection = await (this.offerRepository.dataSource.connector as any).collection("Offer");
            if (offerCollection) {
              offerResult = await offerCollection.aggregate([
                  {
                    '$match': {
                      'status': {'$in': [4, 5, 6]},
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
            return (offerResult && offerResult.length > 0) ? offerResult : [];
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @put('/sales-management/order/{order_id}/product/{product_id}/offer/{offer_id}', {
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
              if (offer) {
                // Offer = Pagado (4) => Confirmar Pago (5)
                offer.status = 5;
                if (photoPath.photo !== '') {
                  offer.photoPaymentReceiptAtAdmin = photoPath.photo;
                }
                offer.confirmedAtAdmin = new Date();
                await this.offerRepository.updateById(offer.id, offer);
                const offerProduct: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(product_id), status: 4} });
                const commerce: Company[] = await this.companyRepository.find({ where: { rut: offer.company}});
                const product: Product = await this.productRepository.findById(product_id);
                if (commerce && commerce.length > 0) {
                  var link: string = process.env.FRONTEND_URL+"/admin/orders/sales";
                  await this.createNotifications('Web', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta pagada', commerce[0].name+': has recibido el pago de '+product.title+' en Planeta Tuercas. Ingresa y confirma!', link, 0, false);
                  await this.createNotifications('SMS', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta pagada', commerce[0].name+': has recibido el pago de '+product.title+' en Planeta Tuercas. Ingresa y confirma!', link, 0, false);
                  await this.createNotifications('Mail', {email: commerce[0].createBy, rut: commerce[0].rut, phone: commerce[0].phone}, { email: '', rut: '', phone: ''}, 'Oferta pagada', commerce[0].name+': has recibido el pago de '+product.title+' en Planeta Tuercas. Ingresa y confirma!', link, 0, false);
                }
                if (offerProduct && offerProduct.length == 0 && product && product.status == 4) {
                  // Product = Pagado (4) => Confirmar Pago (5)
                  product.status = 5;
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
    
  }