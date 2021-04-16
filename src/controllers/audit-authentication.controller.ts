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
  get,
  getModelSchemaRef, param
} from '@loopback/rest';
import {AuditAuthentication} from '../models';
import {AuditAuthenticationRepository} from '../repositories';

export class AuditAuthenticationController {
  constructor(
    @repository(AuditAuthenticationRepository)
    public auditAuthenticationRepository: AuditAuthenticationRepository,
  ) { }

  @get('/audit-authentications/count', {
    responses: {
      '200': {
        description: 'AuditAuthentication model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(AuditAuthentication) where?: Where<AuditAuthentication>,
  ): Promise<Count> {
    return this.auditAuthenticationRepository.count(where);
  }

  @get('/audit-authentications', {
    responses: {
      '200': {
        description: 'Array of AuditAuthentication model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AuditAuthentication, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(AuditAuthentication) filter?: Filter<AuditAuthentication>,
  ): Promise<AuditAuthentication[]> {
    return this.auditAuthenticationRepository.find(filter);
  }

  @get('/audit-authentications/{id}', {
    responses: {
      '200': {
        description: 'AuditAuthentication model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AuditAuthentication, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(AuditAuthentication, {exclude: 'where'}) filter?: FilterExcludingWhere<AuditAuthentication>
  ): Promise<AuditAuthentication> {
    return this.auditAuthenticationRepository.findById(id, filter);
  }
}
