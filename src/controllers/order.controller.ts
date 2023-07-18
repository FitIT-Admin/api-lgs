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
import { OrderRepository, UserRepository } from '../repositories';
import { Order, User } from '../models';
import { ObjectId } from 'mongodb';
import { Product } from '../models/product.model';
import { ProductRepository } from '../repositories/product.repository';
import { OrderCompany } from '../interface/order-company.interface';

  export class OrderController {
    
    constructor(
        @repository(ServiceRepository) public serviceRepository : ServiceRepository,
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
        await this.orderRepository.replaceById(id, order);
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
    ): Promise<any> {
        const orders = await this.orderRepository.find({where: {createBy: email, status: {$ne: -1}}});
        let ordersWithProductsAndCompany: OrderCompany[] = [];
        for (let order of orders) {
            const users = await this.userRepository.find({ where : { email : email}});
            if (users && users.length > 0) {
                let companyOrder = users[0].companies.filter(company => company.rut === order.company);
                ordersWithProductsAndCompany.push({
                    id: order.id,
                    idOrder: order.idOrder,
                    createBy: order.createBy,
                    company: companyOrder[0],
                    status: order.status,
                    closingDate: order.closingDate,
                });
            }
        }
        //console.log(orders);
        return (ordersWithProductsAndCompany) ? ordersWithProductsAndCompany : [];
    
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
  }
  
  
