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
import { OfferWithData } from '../interface/offer-with-data.interface';
import { OrderWithProductOffer } from '../interface/order-with-product-offer.interface';
import { Offer, Order } from '../models';
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
   
    @get('/product/byemail/filter/{email}/{brand}', {
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
  async findOffersFilter(
    @param.path.string('email') email: string,
    @param.path.string('brand') brand: string
  ): Promise<OrderWithProductOffer[]> {
        try {
          let data: OrderWithProductOffer[] = []
          let brands: string[] = brand.split(',');
          var query: {} = {};
          if (brand === 'all') {
            query = { where: { status: {inq: [1,2]}}, order: ['createdAt DESC'] };
          } else {
            query = { where: { status: {inq: [1,2]}, brand: { $in: brands}}, order: ['createdAt DESC'] };
          }
          const orders: Order[] = await this.orderRepository.find(query);
          for (let order of orders) {
            const products: Product[] = await this.productRepository.find({ where: { status: { inq: [1,2]}, idOrder: new ObjectId(order.id)}, order: ['createdAt DESC']});
            if (products && products.length > 0) {
              for (let product of products) {
                data.push({
                  order: order,
                  product: product,
                  offers: []
                });
                const offers: Offer[] = await this.offerRepository.find({ where: { createBy: email, idProduct: new ObjectId(product.id), status: { inq: [2,3]} }});
                data[data.length-1].offers = offers
              }
            }
          }
          return (data && data.length > 0) ? data : [];
        } catch(error) {
            throw new HttpErrors.ExpectationFailed('Error al buscar');
        }
    }
    @get('/product/byemail/{email}', {
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
    async findByEmail(
      @param.path.string('email') email: string
    ): Promise<Product[]> {
          try {
              let products: Product[] = await this.productRepository.find({ where: { status: { inq: [1, 2]}}, order: ['createdAt DESC']});
              for(let i=0;i<products.length;i++){
                  let offers = await this.offerRepository.find({ where: {idProduct :products[i].id, createBy: email, status: {$ne: -1}}});
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
        const productTemp: Product = await this.productRepository.findById(id);
        if (productTemp) {
          const offers: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(productTemp.id), status: {inq: [2,3,4,5,6,7]} }});
          if (offers && offers.length > 0) {
            throw new HttpErrors.ExpectationFailed('product con ofertas');
          } else {
            productTemp.title = product.title;
            productTemp.qty = product.qty;
            productTemp.originalQty = product.originalQty;
            await this.productRepository.updateById(productTemp.id, productTemp);
            console.log("Update Product: "+productTemp.company+", "+productTemp.createBy);
          }
        } else {
          throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @put('/product/delete/{id}', {
      responses: {
        '204': {
          description: 'Products PUT success'
        },
      },
    })
    @authenticate('jwt')
    async deleteById(
      @param.path.string('id') id: string): Promise<void> {
          const productTemp: Product = await this.productRepository.findById(id);
          if (productTemp) {
            const offers: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(productTemp.id), status: {$ne: -1} }});
            let offersAccepted: Offer[] = await offers.filter(elemento => [3, 4, 5, 6, 7].includes(elemento.status));
            if (offersAccepted && offersAccepted.length > 0) {
              throw new HttpErrors.ExpectationFailed('product con ofertas');
            } else {
              let offersNotAccepted: Offer[] = await offers.filter(elemento => [2].includes(elemento.status));
              for (let offer of offersNotAccepted) {
                offer.status = -1;
                await this.offerRepository.updateById(offer.id, offer);
                console.log("Delete Offer: "+offer.company+", "+offer.createBy);
              }
              productTemp.status = -1;
              await this.productRepository.updateById(productTemp.id, productTemp);
              console.log("Delete Product: "+productTemp.company+", "+productTemp.createBy);
            }
          } else {
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
          }
      }

  /*@del('/product/{id}', {
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
    }*/
    
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
