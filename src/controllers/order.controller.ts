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

  export class OrderController {
    
    constructor(
        @repository(ServiceRepository) public serviceRepository : ServiceRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(OrderRepository) public orderRepository: OrderRepository,
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
        console.log(order);
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
    @get('/order/{email}')
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
    ): Promise<any> {
        const order = await this.orderRepository.find({ where : { id : new ObjectId(id)}});
        order[0].status = -1;
        await this.orderRepository.replaceById(order[0].id, order[0]);
        return true;
    }
    @get('/order')
    @response(200, {
        description: 'Order model instance',
        content: {
        'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
            },
        },
    })
    @authenticate('jwt')
    async findAPending(): Promise<any> {
        const orders = await this.orderRepository.find({where: {status: {$ne: -1}}});
        //console.log(orders);
        return orders;
    
    }
  }
  
  