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
import { CompanyRepository, NotificationRepository, OfferRepository, OrderRepository, UserRepository } from '../repositories';
import { Company, Notification, Offer, Order, User } from '../models';
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
        @repository(OfferRepository) public offerRepository: OfferRepository,
        @repository(ProductRepository) public productRepository: ProductRepository,
    ) {}
      
    @post('/order')
    @response(200, {
        description: 'Order model instance'
    })
    @authenticate('jwt')
    async create(
        @requestBody() body: {order: Order, products: Product[], company: Company}
    ): Promise<any> {
        try {
            const order: Order = await this.orderRepository.create(body.order);
            if (body.company.status === 0) {
                const companyTemp: Company[] = await this.companyRepository.find({where: {rut: body.company.rut}});
                companyTemp[0].name = body.company.name;
                companyTemp[0].billingType = body.company.billingType;
                companyTemp[0].type = body.company.type;
                companyTemp[0].direction = body.company.direction;
                companyTemp[0].region = body.company.region;
                companyTemp[0].commune = body.company.commune;
                companyTemp[0].phone = body.company.phone;
                companyTemp[0].accountNumber = body.company.accountNumber;
                companyTemp[0].accountType = body.company.accountType;
                companyTemp[0].bank = body.company.bank;
                companyTemp[0].make = body.company.make;
                companyTemp[0].status = 1;
                await this.companyRepository.updateById(companyTemp[0].id, companyTemp[0]);
            }
            if (body.products.length > 0) {
                for (let product of body.products) {
                    const newProduct: Product = new Product();
                    newProduct.idOrder = order.id;
                    newProduct.title = product.description;
                    newProduct.qty = product.qty;
                    newProduct.originalQty = product.qty;
                    newProduct.createBy = body.company.createBy;
                    newProduct.company = body.company.rut;
                    newProduct.status = 1;
                    await this.productRepository.create(newProduct);
                }
            }
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('error');
        }
    }
    @put('/order/update/{id}')
    @response(204, {
        description: 'Order PUT success',
    })
    @authenticate('jwt')
    async updateById(
        @param.path.string('id') id: string,
        @requestBody() order: Order,
    ): Promise<void> {
        const orderTemp: Order = await this.orderRepository.findById(id);
        const offers: Offer[] = await this.offerRepository.find({ where: { idOrder: new ObjectId(orderTemp.id), status: {$ne: -1} }});
        if (orderTemp) {
            if (offers && offers.length > 0) {
                throw new HttpErrors.ExpectationFailed('order con ofertas');
            } else {
                orderTemp.brand = order.brand;
                orderTemp.model = order.model;
                orderTemp.year = order.year;
                orderTemp.chassis = order.chassis;
                orderTemp.photo = order.photo;
                orderTemp.company = order.company;
                await this.orderRepository.updateById(orderTemp.id, orderTemp);
                console.log("Update Order: "+orderTemp.company+", "+orderTemp.createBy);
            }
        } else {
            throw new HttpErrors.ExpectationFailed('order no existe');
        }
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
    @post('/order/count/email/{email}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async countByEmail(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string
    ): Promise<{count: number}> {
        let period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
        const orders = await this.orderRepository.count({
                and: [
                    {createBy: email},
                    {status: (parameters.status === "") ? {inq: [0, 1, 2]} : Number(parameters.status)},
                    {createdAt: {$gte: period.dateStart}},
                    {createdAt: {$lte: period.dateEnd}}
                ]
            }
        );
        return (orders && orders.count) ? orders : {count: 0};
    
    }
    @post('/order/email/{email}/skip/{skip}/limit/{limit}')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findByEmail(
        @requestBody() parameters: {date: string, status: string},
        @param.path.string('email') email: string,
        @param.path.string('skip') skip: string,
        @param.path.string('limit') limit: string
    ): Promise<Order[]> {
        let period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
        const orders = await this.orderRepository.find({
            where: {
                and: [
                    {createBy: email},
                    {status: (parameters.status === "") ? {inq: [0, 1, 2]} : Number(parameters.status)},
                    {createdAt: {$gte: period.dateStart}},
                    {createdAt: {$lte: period.dateEnd}}
                ]
            },
            skip: Number(skip),
            limit: Number(limit)

        });
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
        const orderTemp: Order = await this.orderRepository.findById(id);
        const products: Product[] = await this.productRepository.find({ where: {idOrder: new ObjectId(orderTemp.id), status: {$ne: -1}}});
        let productsAccepted: Product[] = await products.filter(elemento => [2, 3, 4, 5, 6, 7].includes(elemento.status));
        if (productsAccepted && productsAccepted.length > 0) {
            throw new HttpErrors.ExpectationFailed('products con ofertas');
        } else {
            let productsNotAccepted: Product[] = await products.filter(elemento => [0, 1].includes(elemento.status));
            if (productsNotAccepted && productsNotAccepted.length > 0) {
                const offers: Offer[] = await this.offerRepository.find({ where: {idOrder: new ObjectId(orderTemp.id), status: 2}});
                if (offers && offers.length > 0) {
                    for (let offer of offers) {
                        // Cancelar Ofertas
                        offer.status = -2
                        await this.offerRepository.updateById(offer.id, offer);
                    }
                }
                for (let product of productsNotAccepted) {
                    // Eliminando productos
                    product.status = -1;
                    await this.productRepository.updateById(product.id, product);
                }
                orderTemp.status = -1;
                await this.orderRepository.updateById(orderTemp.id, orderTemp);
                return true;
            } else {
                orderTemp.status = -1;
                await this.orderRepository.updateById(orderTemp.id, orderTemp);
                return true;
            }
        }
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
  
  
