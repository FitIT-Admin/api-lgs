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
import {Privilege} from '../models';
import {PrivilegeRepository} from '../repositories';

export class PrivilegeController {
  constructor(
    @repository(PrivilegeRepository)
    public privilegeRepository : PrivilegeRepository,
  ) {}

  @post('/privileges', {
    responses: {
      '200': {
        description: 'Privilege model instance',
        content: {'application/json': {schema: getModelSchemaRef(Privilege)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Privilege, {
            title: 'NewPrivilege',
            exclude: ['id'],
          }),
        },
      },
    })
    privilege: Omit<Privilege, 'id'>,
  ): Promise<Privilege> {
    return this.privilegeRepository.create(privilege);
  }

  @get('/privileges/count', {
    responses: {
      '200': {
        description: 'Privilege model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Privilege) where?: Where<Privilege>,
  ): Promise<Count> {
    return this.privilegeRepository.count(where);
  }

  @get('/privileges', {
    responses: {
      '200': {
        description: 'Array of Privilege model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Privilege, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Privilege) filter?: Filter<Privilege>,
  ): Promise<Privilege[]> {
    return this.privilegeRepository.find(filter);
  }

  @patch('/privileges', {
    responses: {
      '200': {
        description: 'Privilege PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Privilege, {partial: true}),
        },
      },
    })
    privilege: Privilege,
    @param.where(Privilege) where?: Where<Privilege>,
  ): Promise<Count> {
    return this.privilegeRepository.updateAll(privilege, where);
  }

  @get('/privileges/{id}', {
    responses: {
      '200': {
        description: 'Privilege model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Privilege, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Privilege, {exclude: 'where'}) filter?: FilterExcludingWhere<Privilege>
  ): Promise<Privilege> {
    return this.privilegeRepository.findById(id, filter);
  }

  @patch('/privileges/{id}', {
    responses: {
      '204': {
        description: 'Privilege PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Privilege, {partial: true}),
        },
      },
    })
    privilege: Privilege,
  ): Promise<void> {
    await this.privilegeRepository.updateById(id, privilege);
  }

  @put('/privileges/{id}', {
    responses: {
      '204': {
        description: 'Privilege PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() privilege: Privilege,
  ): Promise<void> {
    await this.privilegeRepository.replaceById(id, privilege);
  }

  @del('/privileges/{id}', {
    responses: {
      '204': {
        description: 'Privilege DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.privilegeRepository.deleteById(id);
  }
}
