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
    @post('/product/count/not-offer/byemail/{email}', {
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
  async countProductsNotOfferByEmail(
    @param.path.string('email') email: string,
    @requestBody() parameters: {date: string, brand: string[]},
  ): Promise<{count: number}> {
        try {
          let data: OrderWithProductOffer[] = [];
          var query: {} = {};
          if (parameters.brand.length <= 0) {
            query = { where: { status: {inq: [1,2]}}, order: ['createdAt DESC'] };
          } else if (parameters.brand[0] === "all") {
            query = { where: { status: {inq: [1,2]}}, order: ['createdAt DESC'] };
          } else {
            query = { where: { status: {inq: [1,2]}, brand: { $in: parameters.brand}}, order: ['createdAt DESC'] };
          }
          const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
          const orders: Order[] = await this.orderRepository.find(query);
          for (let order of orders) {
            
            const products: Product[] = await this.productRepository.find({ 
              where: { 
                and: [
                  {status: { inq: [1,2]}}, 
                  {idOrder: new ObjectId(order.id)}, 
                  {createdAt: {$gte: period.dateStart}},
                  {createdAt: {$lte: period.dateEnd}}
                ]
              }
            });
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
          return (data && data.length > 0) ? {count: data.length} : {count: 0};
        } catch(error) {
            throw new HttpErrors.ExpectationFailed('Error al buscar');
        }
    }
    @post('/product/not-offer/byemail/{email}/skip/{skip}/limit/{limit}', {
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
  async findProductsNotOfferByEmail(
    @param.path.string('email') email: string,
    @param.path.string('skip') skip: string,
    @param.path.string('limit') limit: string,
    @requestBody() parameters: {date: string, brand: string[]},
  ): Promise<OrderWithProductOffer[]> {
        try {
          let data: OrderWithProductOffer[] = []
          var query: {} = {};
          if (parameters.brand.length <= 0) {
            query = { where: { status: {inq: [1,2]}}, order: ['createdAt DESC'] };
          } else if (parameters.brand[0] === "all") {
            query = { where: { status: {inq: [1,2]}}, order: ['createdAt DESC'] };
          } else {
            query = { where: { status: {inq: [1,2]}, brand: { $in: parameters.brand}}, order: ['createdAt DESC'] };
          }
          const period: {dateStart: Date, dateEnd: Date} = this.getPeriod(parameters.date);
          const orders: Order[] = await this.orderRepository.find(query);
          for (let order of orders) {
            const products: Product[] = await this.productRepository.find({ 
              where: { 
                and: [
                  {status: { inq: [1,2]}}, 
                  {idOrder: new ObjectId(order.id)},
                  {createdAt: {$gte: period.dateStart}},
                  {createdAt: {$lte: period.dateEnd}},
                ]
              }
            });
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
      @param.path.string('id') id: string): Promise<boolean> {
          const productTemp: Product = await this.productRepository.findById(id);
          if (productTemp) {
            const offers: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(productTemp.id), status: {$ne: -1} }});
            // Caso cuando ofertas se puedan rechazar por taller
            let offersAccepted: Offer[] = await offers.filter(elemento => [3, 4, 5, 6, 7].includes(elemento.status));
            if (offersAccepted && offersAccepted.length > 0) {
              throw new HttpErrors.ExpectationFailed('product con ofertas');
            } else {
              let offersNotAccepted: Offer[] = await offers.filter(elemento => [2].includes(elemento.status));
              for (let offer of offersNotAccepted) {
                offer.status = -2;
                await this.offerRepository.updateById(offer.id, offer);
                console.log("Cancel Offer: "+offer.company+", "+offer.createBy);
              }
              productTemp.status = -1;
              await this.productRepository.updateById(productTemp.id, productTemp);
              console.log("Delete Product: "+productTemp.company+", "+productTemp.createBy);
              return true;
            }
            // Caso que no existe metodo rechazar por taller
            /*if (offers && offers.length > 0) {
              throw new HttpErrors.ExpectationFailed('product con ofertas');
            } else {
              productTemp.status = -1;
              await this.productRepository.updateById(productTemp.id, productTemp);
              console.log("Delete Product: "+productTemp.company+", "+productTemp.createBy);
              return true;
            }*/
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
