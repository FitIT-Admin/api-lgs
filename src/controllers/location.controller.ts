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
import { LocationRepository } from '../repositories';
import {authenticate} from '@loopback/authentication';
  //import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
  //import {inject} from '@loopback/core';
  
  
  export class LocationController {
    constructor(
      @repository(LocationRepository) public locationRepository: LocationRepository
    ) {}
    @get('/location/region', {
        responses: {
          '200': {
            description: 'Location model instance',
          },
        },
      })
    @authenticate('jwt')
    async findAllRegion(): Promise<{region: string}[]> {
        try {
            const locationCollection = (this.locationRepository.dataSource.connector as any).collection("Location");
            const query: {} = [
                {
                    $group: {
                        _id: "$region"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        region: "$_id"
                    }
                }
            ]
            if (locationCollection) {
              const location: {region: string}[] = await locationCollection.aggregate(query).get();
              //console.log(location);
              return (location && location.length > 0) ? location : [];
            } else {
              return [];
            }
        } catch(error) {
            console.log(error);
            throw new HttpErrors.ExpectationFailed('Error al buscar por id');
        }
    }
    @get('/location/region/{region}/commune', {
      responses: {
        '200': {
          description: 'Location model instance',
        },
      },
    })
    @authenticate('jwt')
    async findCommuneByRegion(
        @param.path.string('region') region: string,
    ): Promise<{commune: string}[]> {
      try {
          const locationCollection = (this.locationRepository.dataSource.connector as any).collection("Location");
          if (locationCollection) {
            //console.log(region);
            const location: {commune: string}[] = await locationCollection.aggregate([
              {
                $match: {
                  region: region
                }
              },
              {
                $group: {
                  _id: "$commune"
                }
              },
              {
                $project: {
                  _id: 0,
                  commune: "$_id"
                }
              }
            ]).get();
            //console.log(location);
            return (location && location.length > 0) ? location : [];
          } else {
            return [];
          }
      } catch(error) {
          console.log(error);
          throw new HttpErrors.ExpectationFailed('Error al buscar por id');
      }
    }
  
  }
  