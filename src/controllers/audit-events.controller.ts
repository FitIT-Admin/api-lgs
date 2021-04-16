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
  getModelSchemaRef, param,



  put,

  requestBody
} from '@loopback/rest';
import {AuditActions} from '../models';
import {AuditActionsRepository} from '../repositories';

export class AuditEventsController {
  constructor(
    @repository(AuditActionsRepository)
    public auditActionsRepository: AuditActionsRepository,
  ) { }


  @get('/audit-events/count', {
    responses: {
      '200': {
        description: 'AuditActions model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(AuditActions) where?: Where<AuditActions>,
  ): Promise<Count> {
    return this.auditActionsRepository.count(where);
  }

  @get('/audit-events', {
    responses: {
      '200': {
        description: 'Array of AuditActions model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AuditActions, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(AuditActions) filter?: Filter<AuditActions>,
  ): Promise<AuditActions[]> {
    return this.auditActionsRepository.find(filter);
  }

  @get('/audit-events/{id}', {
    responses: {
      '200': {
        description: 'AuditActions model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AuditActions, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(AuditActions, {exclude: 'where'}) filter?: FilterExcludingWhere<AuditActions>
  ): Promise<AuditActions> {
    return this.auditActionsRepository.findById(id, filter);
  }

  @put('/audit-events/{id}', {
    responses: {
      '204': {
        description: 'AuditActions PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() auditActions: AuditActions,
  ): Promise<void> {
    await this.auditActionsRepository.replaceById(id, auditActions);
  }
}
