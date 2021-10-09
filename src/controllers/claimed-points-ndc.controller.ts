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
import {Role, User, UserScore, UserScoreDetail, ClaimedPointsNDC} from '../models';
import {AuditActionsRepository, AuditAuthenticationRepository, Credentials, ClaimedPointsNDCRepository, RecoverPasswordRepository, UserRepository, RoleRepository, UserScoreRepository, UserScoreDetailRepository} from '../repositories';
import {EmailManager} from '../services/email.service';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {registerAuditAction, registerAuditAuth} from '../services/validator';
import {
  CredentialsRequestBody
} from './specs/user-controller.specs';

const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail')

export class ClaimedPointsNDCController {
  constructor(
    @repository(RecoverPasswordRepository) public recoverPasswordRepository: RecoverPasswordRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AuditAuthenticationRepository) public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(AuditActionsRepository) public auditActionsRepository: AuditActionsRepository,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @repository(UserScoreRepository) public userScoreRepository: UserScoreRepository,
    @repository(ClaimedPointsNDCRepository) public claimedPointsNDCRepository: ClaimedPointsNDCRepository,
    @repository(UserScoreDetailRepository) public userScoreDetailRepository: UserScoreDetailRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(UserServiceBindings.USER_SERVICE) public userService: UserService<User, Credentials>,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) { }

  @post('/claimedpointsndc', {
    responses: {
      '200': {
        description: 'ClaimedPointsNDC model instance',
        content: {'application/json': {schema: getModelSchemaRef(ClaimedPointsNDC)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ClaimedPointsNDC, {
            title: 'NewClaimedPointsNDC',
            exclude: ['id'],
          }),
        },
      },
    })
    claimedpointsndc: Omit<ClaimedPointsNDC, 'id'>,
  ): Promise<ClaimedPointsNDC> {
    const rut = currentUserProfile[securityId];
    claimedpointsndc.createdBy = rut;
    return this.claimedPointsNDCRepository.create(claimedpointsndc);
  }
 
}
