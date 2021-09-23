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
  del, get,
  getModelSchemaRef, param, post,
  put,
  HttpErrors,
  requestBody
} from '@loopback/rest';
import {Coordinator} from '../models';
import {CoordinatorRepository, UserRepository, PrivilegeRepository} from '../repositories';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';


export class CoordinatorController {
  constructor(
    @repository(CoordinatorRepository)
    public coordinatorRepository: CoordinatorRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(PrivilegeRepository)
    public privilegeRepository: PrivilegeRepository,
  ) { }

  @post('/coordinators', {
    responses: {
      '200': {
        description: 'Coordinators model instance',
        content: {'application/json': {schema: getModelSchemaRef(Coordinator)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Coordinator, {
            title: 'NewCoordinator',
            exclude: ['id'],
          }),
        },
      },
    })

    coordinator: Omit<Coordinator, 'id'>,
  ): Promise<Coordinator> {
    const rut = currentUserProfile[securityId];
    coordinator.createdBy = rut;
    return this.coordinatorRepository.create(coordinator);
  }
  
  @get('/coordinators/count', {
    responses: {
      '200': {
        description: 'Coordinator model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Coordinator) where?: Where<Coordinator>,
  ): Promise<Count> {
    return this.coordinatorRepository.count(where);
  }

  @get('/coordinators', {
    responses: {
      '200': {
        description: 'Array of Coordinator model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Coordinator),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Coordinator) filter?: Filter<Coordinator>,
  ): Promise<Coordinator[]> {
    console.log(filter)
    return this.coordinatorRepository.find(filter);
  }

  @get('/coordinators/{id}', {
    responses: {
      '200': {
        description: 'Coordinator model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Coordinator, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string): Promise<Coordinator> {
    var coordinator = await this.coordinatorRepository.findById(id);
    return coordinator;
  }

  @put('/coordinators/{id}', {
    responses: {
      '204': {
        description: 'Coordinator PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() coordinator: Coordinator,
  ): Promise<void> {
    const coordinatorTemp = await this.coordinatorRepository.findById(id);
    //coordinatorTemp.coordinator = role.coordinator;
    coordinatorTemp.createdBy = coordinator.createdBy;
    coordinatorTemp.id = coordinator.id;
    coordinatorTemp.coordinator = coordinator.coordinator;
    coordinatorTemp.subordinates = coordinator.subordinates;
    await this.coordinatorRepository.updateById(coordinatorTemp.id, coordinatorTemp);
  }

  @del('/coordinators/{id}', {
    responses: {
      '204': {
        description: 'Coordinator DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.coordinatorRepository.deleteById(id);
  }

}
