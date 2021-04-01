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
import {Answer} from '../models';
import {AnswerRepository} from '../repositories';

export class AnswerController {
  constructor(
    @repository(AnswerRepository)
    public answerRepository : AnswerRepository,
  ) {}

  @post('/answers', {
    responses: {
      '200': {
        description: 'Answer model instance',
        content: {'application/json': {schema: getModelSchemaRef(Answer)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Answer, {
            title: 'NewAnswer',
            exclude: ['id'],
          }),
        },
      },
    })
    answer: Omit<Answer, 'id'>,
  ): Promise<Answer> {
    return this.answerRepository.create(answer);
  }

  @get('/answers/count', {
    responses: {
      '200': {
        description: 'Answer model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Answer) where?: Where<Answer>,
  ): Promise<Count> {
    return this.answerRepository.count(where);
  }

  @get('/answers', {
    responses: {
      '200': {
        description: 'Array of Answer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Answer, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Answer) filter?: Filter<Answer>,
  ): Promise<Answer[]> {
    return this.answerRepository.find(filter);
  }

  @patch('/answers', {
    responses: {
      '200': {
        description: 'Answer PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Answer, {partial: true}),
        },
      },
    })
    answer: Answer,
    @param.where(Answer) where?: Where<Answer>,
  ): Promise<Count> {
    return this.answerRepository.updateAll(answer, where);
  }

  @get('/answers/{id}', {
    responses: {
      '200': {
        description: 'Answer model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Answer, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Answer, {exclude: 'where'}) filter?: FilterExcludingWhere<Answer>
  ): Promise<Answer> {
    return this.answerRepository.findById(id, filter);
  }

  @patch('/answers/{id}', {
    responses: {
      '204': {
        description: 'Answer PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Answer, {partial: true}),
        },
      },
    })
    answer: Answer,
  ): Promise<void> {
    await this.answerRepository.updateById(id, answer);
  }

  @put('/answers/{id}', {
    responses: {
      '204': {
        description: 'Answer PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() answer: Answer,
  ): Promise<void> {
    await this.answerRepository.replaceById(id, answer);
  }

  @del('/answers/{id}', {
    responses: {
      '204': {
        description: 'Answer DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.answerRepository.deleteById(id);
  }
}
