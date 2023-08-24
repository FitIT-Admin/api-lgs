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
  import { Offer, Order, VehicleList } from '../models';
import { VehicleListRepository } from '../repositories';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class VehicleListController {
    constructor(
      @repository(VehicleListRepository) public vehicleListRepository: VehicleListRepository
    ) {}
    @get('/vehicle-list/make', {
        responses: {
          '200': {
            description: 'VehicleList model instance',
          },
        },
      })
    //@authenticate('jwt')
    async findAllMake(): Promise<{make: string}[]> {
        try {
            const vehicleListCollection = (this.vehicleListRepository.dataSource.connector as any).collection("VehicleList");
            if (vehicleListCollection) {
              const vehicle: {make: string}[] = await vehicleListCollection.aggregate([
                {
                  $group: {
                    _id: "$make"
                  }
                },
                {
                  $project: {
                    _id: 0,
                    make: "$_id"
                  }
                }
              ]).get();
              //console.log(vehicle.length);
              return (vehicle && vehicle.length > 0) ? vehicle : [];
            } else {
              return [];
            }
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @get('/vehicle-list/make/{make}/model', {
      responses: {
        '200': {
          description: 'VehicleList model instance',
        },
      },
    })
    //@authenticate('jwt')
    async findModelByMake(@param.path.string('make') make: string): Promise<{model: string}[]> {
      try {
          const vehicleListCollection = (this.vehicleListRepository.dataSource.connector as any).collection("VehicleList");
          if (vehicleListCollection) {
            //console.log(make);
            const vehicle: {model: string}[] = await vehicleListCollection.aggregate([
              {
                $match: {
                  make: make
                }
              },
              {
                $group: {
                  _id: "$model"
                }
              },
              {
                $project: {
                  _id: 0,
                  model: "$_id"
                }
              }
            ]).get();
            //console.log(vehicle.length);
            return (vehicle && vehicle.length > 0) ? vehicle : [];
          } else {
            return [];
          }
      } catch(error) {
          console.log(error);
          throw new HttpErrors.ExpectationFailed('Error al buscar por id');
      }
    }
    @get('/vehicle-list/make/{make}/model/{model}/year', {
      responses: {
        '200': {
          description: 'VehicleList model instance',
        },
      },
    })
    //@authenticate('jwt')
    async findYearByMakeModel(
      @param.path.string('make') make: string,
      @param.path.string('model') model: string
      ): Promise<{year: string}[]> {
      try {
          const vehicleListCollection = (this.vehicleListRepository.dataSource.connector as any).collection("VehicleList");
          if (vehicleListCollection) {
            //console.log(make);
            //console.log(model);
            const vehicle: {year: string}[] = await vehicleListCollection.aggregate([
              {
                $match: {
                  make: make,
                  model: model
                }
              },
              {
                $group: {
                  _id: "$year"
                }
              },
              {
                $project: {
                  _id: 0,
                  year: "$_id"
                }
              }
            ]).get();
            //console.log(vehicle.length);
            return (vehicle && vehicle.length > 0) ? vehicle : [];
          } else {
            return [];
          }
      } catch(error) {
          console.log(error);
          throw new HttpErrors.ExpectationFailed('Error al buscar por id');
      }
    }
    @get('/vehicle-list/model', {
      responses: {
        '200': {
          description: 'VehicleList model instance',
        },
      },
    })
    //@authenticate('jwt')
    async findAllModel(): Promise<{model: string}[]> {
      try {
          const vehicleListCollection = (this.vehicleListRepository.dataSource.connector as any).collection("VehicleList");
          if (vehicleListCollection) {
            const vehicle: {model: string}[] = await vehicleListCollection.aggregate([
              {
                $group: {
                  _id: "$model"
                }
              },
              {
                $project: {
                  _id: 0,
                  model: "$_id"
                }
              }
            ]).get();
            //console.log(vehicle.length);
            return (vehicle && vehicle.length > 0) ? vehicle : [];
          } else {
            return [];
          }
      } catch(error) {
          console.log(error);
          throw new HttpErrors.ExpectationFailed('Error al buscar por id');
      }
    }
  
  }
  