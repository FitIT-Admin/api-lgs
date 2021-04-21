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
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';

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
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
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
    const rut = currentUserProfile[securityId];
    form.createdBy = rut;
    form.status = 0;
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
  @authenticate('jwt')
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
  @authenticate('jwt')
  async find(
    @param.filter(Form) filter?: Filter<Form>,
  ): Promise<Form[]> {
    return this.formRepository.find(filter);
  }

  @get('/forms/{slug}', {
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
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string ): Promise<Form> {
    return this.findSlugOrId(slug);
  }

  @put('/forms/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('slug') slug: string,
    @requestBody() form: Form,
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.title = form.title;
    formTemp.description = form.description;
    formTemp.customer = form.customer;
    formTemp.group = form.group;
    formTemp.ot = form.ot;
    formTemp.status = form.status;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }

  @del('/forms/{slug}', {
    responses: {
      '204': {
        description: 'Form DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('slug') slug: string): Promise<void> {
    const form = await this.findSlugOrId(slug);
    await this.formRepository.deleteById(form.id);
  }

  private async findSlugOrId(id: string): Promise<Form> {
    const form = await this.formRepository.searchSlug(id);
    if (form.length > 0) return form[0];
    return await this.formRepository.findById(id);
  }
}
