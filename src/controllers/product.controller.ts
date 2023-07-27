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
import { OfferRepository } from '../repositories/offer.repository';
import { OrderRepository } from '../repositories/order.repository';
import { Product } from '../models/product.model';
import { ObjectId } from 'mongodb';
//import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
//import {inject} from '@loopback/core';


export class ProductController {
  constructor(
    @repository(ProductRepository) public productRepository: ProductRepository,
    @repository(OfferRepository) public offerRepository: OfferRepository,
    @repository(OrderRepository) public orderRepository: OrderRepository
  ) {}

  @post('/product')
  @response(200, {
    description: 'Product model instance',
    content: {'application/json': {schema: getModelSchemaRef(Product)}},
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {
            title: 'NewProduct',
            exclude: ['id'],
          }),
        },
      },
    })

    product: Omit<Product, 'id'>,
  ): Promise<Product> {
    try {
      return this.productRepository.create(product);
    } catch(error) {
      console.log(error);
      throw new HttpErrors.ExpectationFailed('Error al buscar contador');
    }
    
  }

  @get('/product/count', {
    responses: {
      '200': {
        description: 'Products model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Product) where?: Where<Product>,
  ): Promise<Count> {
        try {
            return this.productRepository.count(where);
        } catch(error) {
            throw new HttpErrors.ExpectationFailed('Error al buscar contador');
        }
    }

  @get('/product', {
    responses: {
      '200': {
        description: 'Array of Products model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Product, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Product) filter?: Filter<Product>,
  ): Promise<Product[]> {
        try {
            let products = await this.productRepository.find(filter);
            for(let i=0;i<products.length;i++){
                let offers = await this.offerRepository.find({ where: {idProduct :products[i].id, status: {$ne: -1}}});
                products[i].offer = offers;
                let orders = await this.orderRepository.find({ where: {id :products[i].idOrder}});
                products[i].order = orders; 
            }
            return products;
        } catch(error) {
            throw new HttpErrors.ExpectationFailed('Error al buscar');
        }
    }

  @get('/product/{id}', {
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
  async findById(
    @param.path.string('id') id: string): Promise<Product> {
        try {
   
            let products = await this.productRepository.findById(id);
            let offers = await this.offerRepository.find({ where: {idProduct :id, status: {$ne: -1}}});
            products.offer = offers;
            return products;
            
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }

    @get('/product/order/{id}', {
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
    async findByOrder(
      @param.path.string('id') id: string): Promise<Product[]> {
          try {
              var product: Product[] = await this.productRepository.find({ where: {idOrder: new ObjectId(id), status: {$ne: -1}}});
              return (product && product.length > 0) ? product : [];
          } catch(error) {
              console.log(error);
              throw new HttpErrors.ExpectationFailed('Error al buscar por id');
          }
    }

  @put('/product/{id}', {
    responses: {
      '204': {
        description: 'Products PUT success'
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() product: Product,): Promise<void> {
        try {
            await this.productRepository.replaceById(id, product);
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }

  @del('/product/{id}', {
    responses: {
      '204': {
        description: 'Products DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(
    @param.path.string('id') id: string): Promise<void> {
        try {
            const sparePart = await this.productRepository.findById(id);
            if (sparePart) {
                await this.productRepository.deleteById(sparePart.id);
            } else {
                throw new HttpErrors.ExpectationFailed('Error no se encuentra spare-part');
            }
        } catch (error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    
 @del('/offer/{id}', {
    responses: {
      '204': {
        description: 'Offer DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteByIdOffer(
    @param.path.string('id') id: string): Promise<void> {
        try {
            const offer = await this.offerRepository.findById(id);
            if (offer) {
                await this.offerRepository.deleteById(offer.id);
            } else {
                throw new HttpErrors.ExpectationFailed('Error no se encuentra oferta');
            }
        } catch (error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }

}
