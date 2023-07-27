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
import { OfferRepository, OrderRepository } from '../repositories';
import { Offer, Order } from '../models';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class CartController {
    constructor(
      //@repository(UserRepository) public userRepository: UserRepository,
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
                const orders: Order[] = await this.orderRepository.find({where: {status: 1, createBy: email}});
                let orderOffers: { order: Order, productWithOffers: {product: Product, offers: Offer[]}[]}[] = [];
                let count: number = 0;
                console.log(orders);
                if (orders && orders.length > 0) {
                  for (let order of orders) {
                    const products: Product[] = await this.productRepository.find({ where: { status: { inq: [2, 3] }, idOrder: new ObjectId(order.id) } });
                    console.log(products);
                    if (products && products.length > 0) {
                      orderOffers.push({
                        order: order,
                        productWithOffers: []
                      });
                      for (let product of products) {
                        const offers: Offer[] = await this.offerRepository.find({ where: {status: 3, idProduct: new ObjectId(product.id)} });
                        if (offers && offers.length > 0) {
                          orderOffers[count].productWithOffers.push({
                            product: product,
                            offers: offers
                          });
                        }
                      }
                      count++;
                    }
                    
                  }
                  console.log(orderOffers);
                  return (orderOffers && orderOffers.length > 0) ? orderOffers : []
                }
                return (orderOffers && orderOffers.length > 0) ? orderOffers : [];
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
        @param.path.string('id') id: string
      ): Promise<void> {
            try {
                const orders: Order[] = await this.orderRepository.find({where: { idOrder: id}});
                if (orders && orders.length > 0) {
                  const offers: Offer[] = await this.offerRepository.find({ where: {status: 3, idOrder: new ObjectId(orders[0].id)} });
                  // IDs para cambiar de estado
                  let offersId: string[] = [];
                  for (let offer of offers) {
                    offersId.push(offer.id);
                  }

                  // Definir la condición para seleccionar los registros a actualizar
                  const filter = {
                    idOffer: { $in: offersId },
                  };

                  // Definir el nuevo valor para el campo que se actualizará
                  const update: {} = { status: 4 };

                  console.log(await this.offerRepository.updateAll(update, filter));
                }
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
    
  }
  