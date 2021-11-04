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
export class ServiceController {
  constructor(
    @repository(ServiceRepository)
    public serviceRepository : ServiceRepository,
  ) {}

  @post('/services')
  @response(200, {
    description: 'Service model instance',
    content: {'application/json': {schema: getModelSchemaRef(Service)}},
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Service, {
            title: 'NewService',
            exclude: ['id'],
          }),
        },
      },
    })

    service: Omit<Service, 'id'>,
  ): Promise<Service> {
    return this.serviceRepository.create(service);
  }

  @get('/services/count')
  @response(200, {
    description: 'Service model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async count(
    @param.where(Service) where?: Where<Service>,
  ): Promise<Count> {
    return this.serviceRepository.count(where);
  }

  @get('/services')
  @response(200, {
    description: 'Array of Service model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Service, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Service) filter?: Filter<Service>,
  ): Promise<Service[]> {
    return this.serviceRepository.find(filter);
  }

  @patch('/services')
  @response(200, {
    description: 'Service PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Service, {partial: true}),
        },
      },
    })
    service: Service,
    @param.where(Service) where?: Where<Service>,
  ): Promise<Count> {
    return this.serviceRepository.updateAll(service, where);
  }

  @get('/services/{id}')
  @response(200, {
    description: 'Service model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Service, {includeRelations: true}),
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.number('id') id: string,
    @param.filter(Service, {exclude: 'where'}) filter?: FilterExcludingWhere<Service>
  ): Promise<Service> {
    return this.serviceRepository.findById(id, filter);
  }

  @patch('/services/{id}')
  @response(204, {
    description: 'Service PATCH success',
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Service, {partial: true}),
        },
      },
    })
    service: Service,
  ): Promise<void> {
    await this.serviceRepository.updateById(id, service);
  }

  @put('/services/{id}')
  @response(204, {
    description: 'Service PUT success',
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() service: Service,
  ): Promise<void> {
    await this.serviceRepository.replaceById(id, service);
  }

  @del('/services/{id}')
  @response(204, {
    description: 'Service DELETE success',
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const service = await this.serviceRepository.find({ where : { id : id}});
    await this.serviceRepository.deleteById(service[0].id);
  }
}

