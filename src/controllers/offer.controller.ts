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
import { OfferRepository, OrderRepository, UserRepository } from '../repositories';
import { Company } from '../models/company.model';
import { Offer, Order, User } from '../models';
  export class OrderController {
    
    constructor(
        @repository(ServiceRepository) public serviceRepository : ServiceRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(OrderRepository) public orderRepository: OrderRepository,
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
        console.log(offer);
        return await this.offerRepository.create(offer);
    }
    
    @put('/offer/{id}')
    @response(204, {
        description: 'Offer PUT success',
    })
    @authenticate('jwt')
    async replaceById(
        @param.path.string('id') id: string,
        @requestBody() offer: Offer,
    ): Promise<void> {
        await this.offerRepository.replaceById(id, offer);
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
        const offers = await this.orderRepository.find({where: {createBy: email, company: rut}});
        console.log(offers);
        return offers;
    
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
        const offers = await this.orderRepository.find({where: {createBy: email}});
        console.log(offers);
        return offers;
    
    }
    @put('/offer/delete/{id}')
    @response(204, {
      description: 'Offer DELETE success',
    })
    @authenticate('jwt')
    async deleteById(
        @param.path.string('id') id: string
    ): Promise<any> {
        const offer = await this.offerRepository.find({ where : { id : id}});
        offer[0].status = -1;
        await this.offerRepository.replaceById(offer[0].id, offer);
    }
  }
  
  