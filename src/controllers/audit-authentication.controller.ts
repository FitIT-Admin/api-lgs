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
  put,
  getModelSchemaRef, HttpErrors, param
} from '@loopback/rest';
import {AuditAuthentication} from '../models';
import {AuditAuthenticationRepository, UserRepository} from '../repositories';
import { ObjectId } from 'mongodb';

export class AuditAuthenticationController {
  constructor(
    @repository(AuditAuthenticationRepository)
    public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) { }
  
  @put('/audit-authentications/log-out/{email}/{type}', {
    responses: {
      '200': {
        description: 'AuditAuthentication model instance'
      },
    },
  })
  //@authenticate('jwt')
  async createByUserId(
    @param.path.string('email') email: string,
    @param.path.string('type') type: string,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: {email: email}});
      const auditAuthenticationCollection = (this.auditAuthenticationRepository.dataSource.connector as any).collection("AuditAuthentication");
      if (auditAuthenticationCollection && user) {
        auditAuthenticationCollection.insertOne({
          user: new ObjectId(user.id),
          success: (type == 'jwt expired') ? -2 : (type == 'sign-out') ? -1 : -3,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        return true;
      } else {
        throw new HttpErrors.ExpectationFailed("auditAuthenticationCollection o user es null");
      }
    } catch(error) {
      console.log(error);
      throw new HttpErrors.ExpectationFailed();
    }
  }
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
