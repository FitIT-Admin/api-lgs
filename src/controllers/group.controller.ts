import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  put,
  del,
  requestBody,
  HttpErrors
} from '@loopback/rest';
import {Group} from '../models';
import {GroupRepository, UserRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';

export class GroupController {
  constructor(
    @repository(GroupRepository)
    public groupRepository : GroupRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
  ) {}

  @post('/groups', {
    responses: {
      '200': {
        description: 'Group model instance',
        content: {'application/json': {schema: getModelSchemaRef(Group)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {
            title: 'NewGroup',
            exclude: ['id'],
          }),
        },
      },
    })
    group: Omit<Group, 'id'>,
  ): Promise<Group> {
    const rut = currentUserProfile[securityId];
    group.createdBy = rut;
    return this.groupRepository.create(group);
  }

  @get('/groups/count', {
    responses: {
      '200': {
        description: 'Group model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Group) where?: Where<Group>,
  ): Promise<Count> {
    return this.groupRepository.count(where);
  }

  @get('/groups', {
    responses: {
      '200': {
        description: 'Array of Group model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Group, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Group) filter?: Filter<Group>,
  ): Promise<Group[]> {
    return this.groupRepository.find(filter);
  }

  @get('/groups/{slug}', {
    responses: {
      '200': {
        description: 'Group model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Group, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string ): Promise<Group> {
      var group = await this.findSlugOrId(slug);
      const user = await this.userRepository.find({ where : { rut : group.createdBy}});
      group.createdBy = user[0].name + " " + user[0].lastName  + " " + user[0].secondLastName
      return group;
  }

  @put('/groups/{slug}', {
    responses: {
      '204': {
        description: 'Group PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('slug') slug: string,
    @requestBody() group: Group,
  ): Promise<void> {
    const groupTemp = await this.findSlugOrId(slug);
    groupTemp.description = group.description;
    groupTemp.title = group.title;
    groupTemp.status = group.status;
    groupTemp.organization = groupTemp.organization;
    await this.groupRepository.updateById(groupTemp.id, groupTemp);
  }

  @del('/groups/{slug}', {
    responses: {
      '204': {
        description: 'Group DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('slug') slug: string): Promise<void> {
    var group = await this.findSlugOrId(slug);
    const users = await this.userRepository.find({ where : { group : group.slug}})
    if (users.length > 0){
      throw new HttpErrors.UnprocessableEntity(`No se puede remover porque existen usuarios asociados a este grupo`);
    }
    await this.groupRepository.deleteById(group.id);
  }

  private async findSlugOrId(id: string): Promise<Group> {
    const group = await this.groupRepository.searchSlug(id);
    if (group.length > 0) return group[0];
    return await this.groupRepository.findById(id);
  }
}
