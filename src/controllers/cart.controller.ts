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
import { OrderRepository } from '../repositories';
import { Order } from '../models';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class CartController {
    constructor(
      //@repository(UserRepository) public userRepository: UserRepository,
      @repository(ProductRepository) public productRepository: ProductRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
    ) {}

    @get('/cart/products/{email}', {
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
      async findProductsInCart(
        @param.path.string('email') email: string
      ): Promise<Product[]> {
            try {
                const product: Product[] = await this.productRepository.find({where: {status: 3, createBy: email}});
                console.log("/product/in-cart");
                console.log(product);
                return product;
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
        }
    
  }
  