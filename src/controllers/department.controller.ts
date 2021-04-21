import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {Department} from '../models';
import {DepartmentRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';

export class DepartmentController {
  constructor(
    @repository(DepartmentRepository)
    public departmentRepository : DepartmentRepository,
  ) {}

  @get('/departments/count', {
    responses: {
      '200': {
        description: 'Department model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Department) where?: Where<Department>,
  ): Promise<Count> {
    return this.departmentRepository.count(where);
  }

  @get('/departments', {
    responses: {
      '200': {
        description: 'Array of Department model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Department, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Department) filter?: Filter<Department>,
  ): Promise<Department[]> {
    return this.departmentRepository.find(filter);
  }

  @get('/departments/{slug}', {
    responses: {
      '200': {
        description: 'Department model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Department, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<Department> {
    return this.findSlugOrId(slug);
  }

  private async findSlugOrId(id: string): Promise<Department> {
    const deparment = await this.departmentRepository.searchSlug(id);
    if (deparment.length > 0) return deparment[0];
    return await this.departmentRepository.findById(id);
  }
}
