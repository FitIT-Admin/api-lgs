import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param,


  patch, post,




  put,

  requestBody
} from '@loopback/rest';
import {Commune} from '../models';
import {CommuneRepository} from '../repositories';

export class CommuneController {
  constructor(
    @repository(CommuneRepository)
    public communeRepository: CommuneRepository,
  ) { }

  @post('/communes', {
    responses: {
      '200': {
        description: 'Commune model instance',
        content: {'application/json': {schema: getModelSchemaRef(Commune)}},
      },
    },
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Commune, {
            title: 'NewCommune',
            exclude: ['id'],
          }),
        },
      },
    })
    commune: Omit<Commune, 'id'>,
  ): Promise<Commune> {
    return this.communeRepository.create(commune);
  }

  @get('/communes/count', {
    responses: {
      '200': {
        description: 'Commune model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Commune) where?: Where<Commune>,
  ): Promise<Count> {
    return this.communeRepository.count(where);
  }

  @get('/communes', {
    responses: {
      '200': {
        description: 'Array of Commune model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Commune, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Commune) filter?: Filter<Commune>,
  ): Promise<Commune[]> {
    return this.communeRepository.find(filter);
  }

  @get('/communes/{id}', {
    responses: {
      '200': {
        description: 'Commune model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commune, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Commune, {exclude: 'where'}) filter?: FilterExcludingWhere<Commune>
  ): Promise<Commune> {
    return this.communeRepository.findById(id, filter);
  }

  @patch('/communes/{id}', {
    responses: {
      '204': {
        description: 'Commune PATCH success',
      },
    },
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Commune, {partial: true}),
        },
      },
    })
    commune: Commune,
  ): Promise<void> {
    await this.communeRepository.updateById(id, commune);
  }

  @put('/communes/{id}', {
    responses: {
      '204': {
        description: 'Commune PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() commune: Commune,
  ): Promise<void> {
    await this.communeRepository.replaceById(id, commune);
  }

  @del('/communes/{id}', {
    responses: {
      '204': {
        description: 'Commune DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.communeRepository.deleteById(id);
  }
}
