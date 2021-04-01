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
} from '@loopback/rest';
import {Alternative} from '../models';
import {AlternativeRepository} from '../repositories';

export class AlternativeController {
  constructor(
    @repository(AlternativeRepository)
    public alternativeRepository : AlternativeRepository,
  ) {}

  @post('/alternatives', {
    responses: {
      '200': {
        description: 'Alternative model instance',
        content: {'application/json': {schema: getModelSchemaRef(Alternative)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alternative, {
            title: 'NewAlternative',
            exclude: ['id'],
          }),
        },
      },
    })
    alternative: Omit<Alternative, 'id'>,
  ): Promise<Alternative> {
    return this.alternativeRepository.create(alternative);
  }

  @get('/alternatives/count', {
    responses: {
      '200': {
        description: 'Alternative model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Alternative) where?: Where<Alternative>,
  ): Promise<Count> {
    return this.alternativeRepository.count(where);
  }

  @get('/alternatives', {
    responses: {
      '200': {
        description: 'Array of Alternative model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Alternative, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Alternative) filter?: Filter<Alternative>,
  ): Promise<Alternative[]> {
    return this.alternativeRepository.find(filter);
  }

  @patch('/alternatives', {
    responses: {
      '200': {
        description: 'Alternative PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alternative, {partial: true}),
        },
      },
    })
    alternative: Alternative,
    @param.where(Alternative) where?: Where<Alternative>,
  ): Promise<Count> {
    return this.alternativeRepository.updateAll(alternative, where);
  }

  @get('/alternatives/{id}', {
    responses: {
      '200': {
        description: 'Alternative model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Alternative, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Alternative, {exclude: 'where'}) filter?: FilterExcludingWhere<Alternative>
  ): Promise<Alternative> {
    return this.alternativeRepository.findById(id, filter);
  }

  @patch('/alternatives/{id}', {
    responses: {
      '204': {
        description: 'Alternative PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Alternative, {partial: true}),
        },
      },
    })
    alternative: Alternative,
  ): Promise<void> {
    await this.alternativeRepository.updateById(id, alternative);
  }

  @put('/alternatives/{id}', {
    responses: {
      '204': {
        description: 'Alternative PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() alternative: Alternative,
  ): Promise<void> {
    await this.alternativeRepository.replaceById(id, alternative);
  }

  @del('/alternatives/{id}', {
    responses: {
      '204': {
        description: 'Alternative DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.alternativeRepository.deleteById(id);
  }
}
