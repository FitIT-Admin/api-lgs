import {
  Filter,
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {Organization} from '../models';
import {OrganizationRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';

export class OrganizationController {
  constructor(
    @repository(OrganizationRepository)
    public organizationRepository : OrganizationRepository,
  ) {}

  @get('/organizations', {
    responses: {
      '200': {
        description: 'Array of Organization model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Organization, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Organization) filter?: Filter<Organization>,
  ): Promise<Organization[]> {
    return this.organizationRepository.find(filter);
  }

  @get('/organizations/{slug}', {
    responses: {
      '200': {
        description: 'Organization model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Organization, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<Organization> {
    return this.findSlugOrId(slug);
  }
  private async findSlugOrId(id: string): Promise<Organization> {
    const org = await this.organizationRepository.searchSlug(id);
    if (org.length > 0) return org[0];
    return await this.organizationRepository.findById(id);
  }
}
