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
import {Question} from '../models';
import {QuestionRepository} from '../repositories';

export class QuestionController {
  constructor(
    @repository(QuestionRepository)
    public questionRepository : QuestionRepository,
  ) {}

  @post('/questions', {
    responses: {
      '200': {
        description: 'Question model instance',
        content: {'application/json': {schema: getModelSchemaRef(Question)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Question, {
            title: 'NewQuestion',
            exclude: ['id'],
          }),
        },
      },
    })
    question: Omit<Question, 'id'>,
  ): Promise<Question> {
    return this.questionRepository.create(question);
  }

  @get('/questions/count', {
    responses: {
      '200': {
        description: 'Question model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Question) where?: Where<Question>,
  ): Promise<Count> {
    return this.questionRepository.count(where);
  }

  @get('/questions', {
    responses: {
      '200': {
        description: 'Array of Question model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Question, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Question) filter?: Filter<Question>,
  ): Promise<Question[]> {
    return this.questionRepository.find(filter);
  }

  @patch('/questions', {
    responses: {
      '200': {
        description: 'Question PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Question, {partial: true}),
        },
      },
    })
    question: Question,
    @param.where(Question) where?: Where<Question>,
  ): Promise<Count> {
    return this.questionRepository.updateAll(question, where);
  }

  @get('/questions/{id}', {
    responses: {
      '200': {
        description: 'Question model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Question, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Question, {exclude: 'where'}) filter?: FilterExcludingWhere<Question>
  ): Promise<Question> {
    return this.questionRepository.findById(id, filter);
  }

  @patch('/questions/{id}', {
    responses: {
      '204': {
        description: 'Question PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Question, {partial: true}),
        },
      },
    })
    question: Question,
  ): Promise<void> {
    await this.questionRepository.updateById(id, question);
  }

  @put('/questions/{id}', {
    responses: {
      '204': {
        description: 'Question PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() question: Question,
  ): Promise<void> {
    await this.questionRepository.replaceById(id, question);
  }

  @del('/questions/{id}', {
    responses: {
      '204': {
        description: 'Question DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.questionRepository.deleteById(id);
  }
}
