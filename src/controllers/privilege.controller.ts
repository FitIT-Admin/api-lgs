import {
  Count,
  CountSchema,
  Filter,
  PredicateComparison,
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
  HttpErrors,
  requestBody,
} from '@loopback/rest';
import {Privilege} from '../models';
import {PrivilegeRepository, RoleRepository, UserRepository} from '../repositories';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';

export class PrivilegeController {
  constructor(
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(PrivilegeRepository)
    public privilegeRepository: PrivilegeRepository,
  ) {}

  @post('/privileges', {
    responses: {
      '200': {
        description: 'Privilege model instance',
        content: {'application/json': {schema: getModelSchemaRef(Privilege)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
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
    const email = currentUserProfile[securityId];
    privilege.createdBy = email;
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
  @authenticate('jwt')
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
  @authenticate('jwt')
  async find(
    @param.filter(Privilege) filter?: Filter<Privilege>,
  ): Promise<Privilege[]> {
    return this.privilegeRepository.find(filter);
  }

  @get('/privileges/{slug}', {
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
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<Privilege> {
    var privilege = await this.findSlugOrId(slug);
    const user = await this.userRepository.find({ where : { email : privilege.createdBy}});
    privilege.createdBy = user[0].name + " " + user[0].lastName  + " " + user[0].secondLastName
    return privilege;
  }

  @put('/privileges/{slug}', {
    responses: {
      '204': {
        description: 'Privilege PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('slug') slug: string,
    @requestBody() privilege: Privilege,
  ): Promise<void> {
    const privilegeTemp = await this.findSlugOrId(slug);
    privilegeTemp.description = privilege.description;
    privilegeTemp.title = privilege.title;
    privilegeTemp.role = privilege.role;
    privilegeTemp.url = privilege.url;
    privilegeTemp.icon = privilege.icon;
    privilegeTemp.canView = privilege.canView;
    privilegeTemp.canEdit = privilege.canEdit;
    privilegeTemp.canRemove = privilege.canRemove;
    await this.privilegeRepository.updateById(privilegeTemp.id, privilegeTemp);
    const privilegeNew = await this.privilegeRepository.findById(privilegeTemp.id);
    let roles = await this.roleRepository.find({ where : { privilege : slug  as PredicateComparison<string[]>}});
    for (let role of roles){
      for (let i = 0; i < role.privilege.length; i++){
        if (role.privilege[i] === slug){
          role.privilege[i] = privilegeNew.slug
          await this.roleRepository.update(role);
        }
      }
    }
  }

  @del('/privileges/{slug}', {
    responses: {
      '204': {
        description: 'Privilege DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('slug') slug: string): Promise<void> {
    const privilege = await this.findSlugOrId(slug);
    await this.privilegeRepository.deleteById(privilege.id);
  }

  private async findSlugOrId(id: string): Promise<Privilege> {
    const privilege = await this.privilegeRepository.searchSlug(id);
    if (privilege.length > 0) return privilege[0];
    return await this.privilegeRepository.findById(id);
  }
}
