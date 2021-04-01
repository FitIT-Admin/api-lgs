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
import {Form} from '../models';
import {FormRepository} from '../repositories';

export class FormController {
  constructor(
    @repository(FormRepository)
    public formRepository : FormRepository,
  ) {}

  @post('/forms', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {'application/json': {schema: getModelSchemaRef(Form)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Form, {
            title: 'NewForm',
            exclude: ['id'],
          }),
        },
      },
    })
    form: Omit<Form, 'id'>,
  ): Promise<Form> {
    return this.formRepository.create(form);
  }

  @get('/forms/count', {
    responses: {
      '200': {
        description: 'Form model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Form) where?: Where<Form>,
  ): Promise<Count> {
    return this.formRepository.count(where);
  }

  @get('/forms', {
    responses: {
      '200': {
        description: 'Array of Form model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Form, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Form) filter?: Filter<Form>,
  ): Promise<Form[]> {
    return this.formRepository.find(filter);
  }

  @patch('/forms', {
    responses: {
      '200': {
        description: 'Form PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Form, {partial: true}),
        },
      },
    })
    form: Form,
    @param.where(Form) where?: Where<Form>,
  ): Promise<Count> {
    return this.formRepository.updateAll(form, where);
  }

  @get('/forms/{id}', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Form, {exclude: 'where'}) filter?: FilterExcludingWhere<Form>
  ): Promise<Form> {
    return this.formRepository.findById(id, filter);
  }

  @patch('/forms/{id}', {
    responses: {
      '204': {
        description: 'Form PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Form, {partial: true}),
        },
      },
    })
    form: Form,
  ): Promise<void> {
    await this.formRepository.updateById(id, form);
  }

  @put('/forms/{id}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() form: Form,
  ): Promise<void> {
    await this.formRepository.replaceById(id, form);
  }

  @del('/forms/{id}', {
    responses: {
      '204': {
        description: 'Form DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.formRepository.deleteById(id);
  }
}
