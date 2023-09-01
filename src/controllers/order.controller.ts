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
import { CompanyRepository, NotificationRepository, OrderRepository, UserRepository } from '../repositories';
import { Company, Notification, Order, User } from '../models';
import { ObjectId } from 'mongodb';
import { Product } from '../models/product.model';
import { ProductRepository } from '../repositories/product.repository';
import { OrderCompany } from '../interface/order-company.interface';

  export class OrderController {
    
    constructor(
        @repository(NotificationRepository) public notificationRepository : NotificationRepository,
        @repository(CompanyRepository) public companyRepository: CompanyRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(OrderRepository) public orderRepository: OrderRepository,
        @repository(ProductRepository) public productRepository: ProductRepository,
    ) {}
      
    @post('/order')
    @response(200, {
        description: 'Order model instance'
    })
    @authenticate('jwt')
    async create(
    @requestBody({
        content: {
            'application/json': {
            schema: getModelSchemaRef(Order, {
                title: 'NewOrder',
                exclude: ['id'],
                }),
            },
        },
    })
    order: Omit<Order, 'id'>,
    ): Promise<Order> {
        //console.log(order);
        return await this.orderRepository.create(order);
    }
    
    @put('/order/{id}')
    @response(204, {
        description: 'Order PUT success',
    })
    @authenticate('jwt')
    async replaceById(
        @param.path.string('id') id: string,
        @requestBody() order: Order,
    ): Promise<void> {
        try {
            await this.orderRepository.replaceById(id, order);
            if (order.status == 1) {
                // Definir la condición para seleccionar los registros a actualizar
                const filter: {} = { idOrder: new ObjectId(id), status: 0};

                // Definir el nuevo valor para el campo que se actualizará
                const update: {} = { status: 1 };

                console.log(await this.productRepository.updateAll(update, filter));
                let commerceResult: any[] = [];
                const companyCollection = (this.companyRepository.dataSource.connector as any).collection("Company");
                if (companyCollection) {
                    commerceResult = await companyCollection.aggregate([
                        {
                            '$match': {
                                'type': "comercio",
                                'make': {'$in': [order.brand]}
                              }
                        }, {
                            '$lookup': {
                                'from': 'User',
                                'localField': 'createBy',
                                'foreignField': 'email',
                                'as': 'user'
                            }
                        }, {
                            '$addFields': {
                                'user': { '$first': "$user" }, 
                            }
                        }
                    ]).get();
                    const products: Product[] = await this.productRepository.find({where: { idOrder: new ObjectId(id)}});
                    if (commerceResult && commerceResult.length > 0 && products && products.length > 0) {
                        for (let commerce of commerceResult) {
                            var link: string = process.env.FRONTEND_URL+"/admin/orders/offers";
                            for (let product of products) {
                                await this.createNotifications('Web', {email: commerce.createBy, rut: commerce.rut, phone: commerce.phone}, { email: '', rut: '', phone: ''}, 'Producto publicado', commerce.name+': Alguien necesita un '+product.title+' en Planeta Tuercas que podrías vender! Haz tu oferta Ya! en tu Mesón Virtual', link, 0, false);
                            }
                            await this.createNotifications('SMS', {email: commerce.createBy, rut: commerce.rut, phone: commerce.phone}, { email: '', rut: '', phone: ''}, 'Pedido publicado', commerce.name+': Alguien necesita un producto en Planeta Tuercas que podrías vender! Haz tu oferta Ya! en tu Mesón Virtual', link, 0, false);
                            //await this.createNotifications('Mail', {email: commerce.createBy, rut: commerce.rut, phone: commerce.phone}, { email: '', rut: '', phone: ''}, 'Pedido publicado', commerce.name+': Alguien necesita un producto en Planeta Tuercas que podrías vender! Haz tu oferta Ya! en tu Mesón Virtual', link, 0, false);
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    @get('/order/{email}/{rut}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByRut(
        @param.path.string('email') email: string,
        @param.path.string('rut') rut: string,
    ): Promise<any> {
        const orders = await this.orderRepository.find({where: {createBy: email, company: rut, status: {$ne: -1}}});
        //console.log(orders);
        return orders;
    
    }
    @get('/order/email/{email}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async find(
        @param.path.string('email') email: string
    ): Promise<Order[]> {
        const orders = await this.orderRepository.find({where: {createBy: email, status: {inq: [0, 1, 2]}}});
        //console.log(orders);
        return (orders && orders.length > 0) ? orders : [];
    
    }
    @get('/order/{id}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findById(
        @param.path.string('id') id: string
    ): Promise<any> {
        const orders = await this.orderRepository.findById(id);
        //console.log(orders);
        return orders;
    
    }
    @put('/order/delete/{id}')
    @response(204, {
      description: 'Order DELETE success',
    })
    @authenticate('jwt')
    async deleteById(
        @param.path.string('id') id: string
    ): Promise<boolean> {
        const order: Order = await this.orderRepository.findById(id);
        order.status = -1;
        await this.orderRepository.replaceById(order.id, order);
        const products: Product[] = await this.productRepository.find({ where: {idOrder: new ObjectId(order.id), status: {$ne: -1}}});
        for (let product of products) {
            product.status = -1;
            await this.productRepository.updateById(product.id, product);
        }
        return true;
    }
    
    @get('/order/byidorder/{idOrder}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findAByOrderId(@param.path.string('idOrder') idOrder: string,): Promise<any> {
        let orders = await this.orderRepository.find({where: {idOrder: idOrder}});
        return orders[0];
    
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
  
  
