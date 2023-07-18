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
  export class OfferController {
    
    constructor(
        @repository(ServiceRepository) public serviceRepository : ServiceRepository,
        @repository(UserRepository) public userRepository: UserRepository,
        @repository(OrderRepository) public orderRepository: OrderRepository,
        @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
      
    @post('/offer/{id}')
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
    offer: Offer, @param.path.string('id') id: string
    ): Promise<void> {
        const orderTemp = await this.orderRepository.findById(id);
        orderTemp.offers.push(offer);
        return await this.orderRepository.updateById(orderTemp.id, orderTemp);
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
    @put('/offer/delete/{idOffer}/{idOrder}')
    @response(204, {
      description: 'Offer DELETE success',
    })
    @authenticate('jwt')
    async deleteById(
        @param.path.string('idOffer') idOffer: string,
        @param.path.string('idOrder') idOrder: string
    ): Promise<any> {
        let orders = await this.orderRepository.find({where: {idOrder: idOrder}});
        if(orders[0].offers.length > 0){
            let arr = orders[0].offers;
            let idxObj = await arr.findIndex((object: any) => {
              return object.idOffer === idOffer;
            });
            arr.splice(idxObj,1);
            const orderTemp = await this.orderRepository.findById(orders[0].id);
            orderTemp.offers = arr;
            await this.orderRepository.updateById(orderTemp.id, orderTemp);
        }
        return true;
    }
  }
  
  