import {
  authenticate, TokenService,
  UserService
} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Filter,
  repository,
  FilterExcludingWhere,
  CountSchema,
  Count,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  del,


  HttpErrors, param,
  post,
  put,
  requestBody
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import * as Sentry from '@sentry/node';
import {promisify} from 'util';
import {
  EmailManagerBindings, PasswordHasherBindings, TokenServiceBindings,

  UserServiceBindings
} from '../keys';
import {Role, User, UserScore, UserScoreDetail} from '../models';
import {AuditActionsRepository, AuditAuthenticationRepository, Credentials, RecoverPasswordRepository, UserRepository, RoleRepository, UserScoreRepository, UserScoreDetailRepository} from '../repositories';
import {EmailManager} from '../services/email.service';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {registerAuditAction, registerAuditAuth} from '../services/validator';
import {
  CredentialsRequestBody
} from './specs/user-controller.specs';

const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail')

export class UserScoreController {
  constructor(
    @repository(RecoverPasswordRepository) public recoverPasswordRepository: RecoverPasswordRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AuditAuthenticationRepository) public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(AuditActionsRepository) public auditActionsRepository: AuditActionsRepository,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @repository(UserScoreRepository) public userScoreRepository: UserScoreRepository,
    @repository(UserScoreDetailRepository) public userScoreDetailRepository: UserScoreDetailRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(UserServiceBindings.USER_SERVICE) public userService: UserService<User, Credentials>,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) { }

  @get('/user-score/{codigo_andes}/{codigo_tango}', {
    responses: {
      '200': {
        description: 'Region model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(UserScore, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findByCodigo(
    @param.path.string('codigo_andes') codigo_andes: string,
    @param.path.string('codigo_tango') codigo_tango: string,
  ): Promise<UserScore> {
      try {
        
        var puntos: any = [];
        puntos.push(await this.userScoreRepository.findOne(
            { where: 
                {
                    codigo: codigo_andes
                },
                order: ["periodo DESC"],
                limit: 1
                }));
        puntos.push(await this.userScoreRepository.findOne(
            { where: 
                {
                    codigo: codigo_tango
                },
                order: ["periodo DESC"],
                limit: 1
                }));

        if (puntos) {
          return puntos;
        } 
      throw new HttpErrors.Unauthorized();
    } catch (ex) {
      console.log(ex);
      throw new HttpErrors.Unauthorized();
    }
  }
  
  @get('/user-score/all/{codigo_andes}/{codigo_tango}', {
    responses: {
      '200': {
        description: 'Region model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(UserScore, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findByAll(
    @param.path.string('codigo_andes') codigo_andes: string,
    @param.path.string('codigo_tango') codigo_tango: string,
  ): Promise<UserScore> {
      try {
      
          var puntos: any = [];
      
            var match =
            [
                {
                    $match: {
                        $or: [
                            {
                                codigo: codigo_andes
                            }, {
                                codigo: codigo_tango
                            }
                        ]
                    }
                }, {
                    $group: {
                        _id: {
                            periodo: {
                                $dateFromString: {
                                 dateString: '$periodo'
                            }
                        }}, 
                        puntosVTR: {
                            $sum: '$puntosVTR'
                        }, 
                        puntosAS: {
                            $sum: '$puntosAS'
                        }, 
                        cuenta: {
                            $sum: '$cuenta'
                        }
                    }
                }, {
                    $sort: {
                        '_id.periodo': 1
                    }
                }
            ];


        const userScoreDetail = (this.userScoreDetailRepository.dataSource.connector as any).collection("UserScore");
        
        puntos.push(await userScoreDetail
            .aggregate(
             match
        ).get());

        if (puntos) {
          return puntos;
        } 
        
      throw new HttpErrors.Unauthorized();
    } catch (ex) {
      console.log(ex);
      throw new HttpErrors.Unauthorized();
    }
  }

 
@get('/user-score/bydate/{codigo_andes}/{codigo_tango}/{periodo}', {
    responses: {
      '200': {
        description: 'Region model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(UserScoreDetail, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findByDate(
    @param.path.string('codigo_andes') codigo_andes: string,
    @param.path.string('codigo_tango') codigo_tango: string,
    @param.path.string('periodo') periodo: string
  ): Promise<UserScoreDetail> {

      try {
        
        var puntos: any = [];
        puntos.push(await this.userScoreDetailRepository.find(
            { where: {
            "and": [
                { "or": [ { "CODIGO": codigo_andes }, { "CODIGO": codigo_tango } ]
            }, {
            "and": [ { "FECHAFIN": periodo } ]
            }]
        },
            order: ["id DESC"]
            }));
        
        if (puntos) {
          return puntos;
}
      throw new HttpErrors.Unauthorized();
    } catch (ex) {
      console.log(ex);
      throw new HttpErrors.Unauthorized();
    }
  }
 
}
