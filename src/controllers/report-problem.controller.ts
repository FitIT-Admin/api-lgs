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
import {ReportProblem} from '../models';
import {ReportProblemRepository} from '../repositories';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
export class ReportProblemController {
  constructor(
    @repository(ReportProblemRepository)
    public reportProblemRepository : ReportProblemRepository,
  ) {}

  @post('/report-problems', {
    responses: {
      '200': {
        description: 'ReportProblem model instance',
        content: {'application/json': {schema: getModelSchemaRef(ReportProblem)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ReportProblem, {
            title: 'NewReportProblem',
            exclude: ['id'],
          }),
        },
      },
    })
    reportProblem: Omit<ReportProblem, 'id'>,
  ): Promise<ReportProblem> {
    const rut = currentUserProfile[securityId];
    reportProblem.createdBy = rut;
    return this.reportProblemRepository.create(reportProblem);
  }

  @get('/report-problems/count', {
    responses: {
      '200': {
        description: 'ReportProblem model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(ReportProblem) where?: Where<ReportProblem>,
  ): Promise<Count> {
    return this.reportProblemRepository.count(where);
  }

  @get('/report-problems', {
    responses: {
      '200': {
        description: 'Array of ReportProblem model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(ReportProblem, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(ReportProblem) filter?: Filter<ReportProblem>,
  ): Promise<ReportProblem[]> {
    return this.reportProblemRepository.find(filter);
  }

  @get('/report-problems/{slug}', {
    responses: {
      '200': {
        description: 'ReportProblem model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ReportProblem, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<ReportProblem> {
    return this.findSlugOrId(slug);
  }

  private async findSlugOrId(id: string): Promise<ReportProblem> {
    const problem = await this.reportProblemRepository.searchSlug(id);
    if (problem.length > 0) return problem[0];
    return await this.reportProblemRepository.findById(id);
  }
}
