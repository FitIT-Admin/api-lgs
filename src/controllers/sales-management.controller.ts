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
import { OfferRepository, OrderRepository, UserRepository } from '../repositories';
import { Offer, Order, User } from '../models';
import { Company } from '../interface/company.interface';
import { OfferWithData } from '../interface/offer-with-data.interface';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class SalesManagementController {
    constructor(
      @repository(UserRepository) public userRepository: UserRepository,
      @repository(ProductRepository) public productRepository: ProductRepository,
      @repository(OrderRepository) public orderRepository: OrderRepository,
      @repository(OfferRepository) public offerRepository: OfferRepository,
    ) {}
    @get('/sales-management/orders', {
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
    async findOrders(
    ): Promise<OfferWithData[]> {
        try {
            let offerResult: OfferWithData[] = [];
            const offerCollection = await (this.offerRepository.dataSource.connector as any).collection("Offer");
            if (offerCollection) {
              offerResult = await offerCollection.aggregate([
                  {
                    '$match': {
                      'status': 4,
                    }
                  }, {
                    '$lookup': {
                      'from': 'Product',
                      'localField': 'idProduct',
                      'foreignField': '_id',
                      'as': 'product'
                    }
                  }, {
                    '$lookup': {
                      'from': 'Order',
                      'localField': 'idOrder',
                      'foreignField': '_id',
                      'as': 'order'
                    }
                  }, {
                    '$lookup': {
                      'from': 'Company',
                      'localField': 'company',
                      'foreignField': 'rut',
                      'as': 'commerce'
                    }
                  }, {
                    '$addFields': {
                      'product': { '$first': "$product" }, 
                      'order': { '$first': "$order" },
                      'commerce': { '$first': "$commerce" },
                    }
                  }, {
                    '$lookup': {
                      'from': 'Company',
                      'localField': 'order.company',
                      'foreignField': 'rut',
                      'as': 'workshop'
                    }
                  }, {
                    '$addFields': {
                      'workshop': { '$first': "$workshop" },
                    }
                  }, {
                    '$sort': { _id: 1 }
                  }
                ]).get();
            }
            return (offerResult && offerResult.length > 0) ? offerResult : [];
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @put('/sales-management/order/{order_id}/product/{product_id}/offer/{offer_id}', {
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
        @param.path.string('offer_id') offer_id: string,
        @param.path.string('product_id') product_id: string,
        @param.path.string('order_id') order_id: string,
        @requestBody() photoPath: {photo: string}
      ): Promise<void> {
            try {
              const offer: Offer = await this.offerRepository.findById(offer_id);
              if (offer) {
                // Offer = Pagado (4) => Confirmar Pago (5)
                offer.status = 5;
                if (photoPath.photo !== '') {
                  offer.photoPaymentReceiptAtAdmin = photoPath.photo;
                }
                offer.confirmedAtAdmin = new Date();
                await this.offerRepository.updateById(offer.id, offer);
                const offerProduct: Offer[] = await this.offerRepository.find({ where: { idProduct: new ObjectId(product_id), status: 4} });
                const product: Product = await this.productRepository.findById(product_id);
                if (offerProduct && offerProduct.length == 0 && product && product.status == 4) {
                  // Product = Pagado (4) => Confirmar Pago (5)
                  product.status = 5;
                  await this.productRepository.updateById(product.id, product);
                }
              }
            } catch(error) {
                console.log(error);
                throw new HttpErrors.ExpectationFailed('Error al buscar por id');
            }
      }
    
  }