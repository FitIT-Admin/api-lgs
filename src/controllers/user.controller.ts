import {
  authenticate, TokenService,
  UserService
} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Filter,
  repository,
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
import {Role, User} from '../models';
import {AuditActionsRepository, AuditAuthenticationRepository, Credentials, RecoverPasswordRepository, UserRepository, RoleRepository} from '../repositories';
import {EmailManager} from '../services/email.service';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {registerAuditAction, registerAuditAuth} from '../services/validator';
import {
  CredentialsRequestBody
} from './specs/user-controller.specs';

const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail')

export type IsLoggedIn = {
  valid: Boolean;
  profile: User;
};


export class UserController {
  constructor(
    @repository(RecoverPasswordRepository) public recoverPasswordRepository: RecoverPasswordRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AuditAuthenticationRepository) public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(AuditActionsRepository) public auditActionsRepository: AuditActionsRepository,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(UserServiceBindings.USER_SERVICE) public userService: UserService<User, Credentials>,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) { }

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',

          }),
        },
      },
    })
    user: User,
  ): Promise<User> {
    const rut = currentUserProfile[securityId];
    user.createdBy = rut;
    user.status = 0;
    user.failedAttempts = 0;
    const created =  this.userRepository.create(user);
    if (user.email){
      let fullname = user.name + " " + user.lastName;
      this.sendRegisteredUserEmail(user.email, fullname);
    }
    return created;
  }

  private async sendRegisteredUserEmail(email : string, fullname : string){
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
        to: email, // Change to your recipient
        from: process.env.SENDGRID_SENDER_FROM, 
        subject: 'Nielsen Group - Registro de Cuenta',
        html: this.emailManager.getHTMLRegisterUserEmail(fullname)
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log("Successfully sent new account email to: " + fullname + " - " + email);
        })
        .catch((error: string) => {
          console.error(error)
        })
  }

  @get('/users', {
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, {includeRelations: false}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @get('/users/{rut}', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('rut') rut: string) : Promise<User> {
    const users = await this.userRepository.find({ where : { rut : rut}});
    return users[0];
  }

  @put('/users/{rut}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('rut') rut: string,
    @requestBody() user: User,
  ): Promise<void> {
    const users = await this.userRepository.find({ where : { rut : rut}});
    users[0].name = user.name;
    users[0].lastName = user.lastName;
    users[0].secondLastName = user.secondLastName;
    users[0].email = user.email;
    users[0].phone = user.phone;
    users[0].nationality = user.nationality;
    users[0].role = user.role;
    users[0].status = user.status;
    users[0].charge = user.charge;
    users[0].department = user.department;
    users[0].group = user.group;
    await this.userRepository.updateById(users[0].id, users[0]);
  }

  @put('/users/status/{rut}/{status}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  @authenticate('jwt')
  async changeStatus(
    @param.path.string('rut') rut: string,
    @param.path.number('status') status: number,
  ): Promise<void> {
    const users = await this.userRepository.find({ where : { rut : rut}});
    users[0].status = status;
    await this.userRepository.replaceById(users[0].id, users[0]);
  }

  @post('/users/authentication', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async authentication(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<Object> {

    var user = await this.userRepository.findOne({where: {rut: credentials.rut}});
    if (user){
      const role = await this.findRoleSlugOrId(user.role);
      const verifyUser = await this.userService.verifyCredentials(credentials);
      const userProfile = this.userService.convertToUserProfile(verifyUser);
      const token = await this.jwtService.generateToken(userProfile);
      await this.auditAuthenticationRepository.create(registerAuditAuth(verifyUser.id, 1));

      return {
        rut: user.rut,
        name: user.name + " " + user.lastName,
        email: user.email,
        role: {
          slug: role.slug,
          name: role.title
        },
        privilege: role.privilege,
        token: token
      };
    }
    throw new HttpErrors.Unauthorized("Usuario no registrado, favor contacte al administrador");    
  }

  @get('/users/logged-in', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': Boolean,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async isLoggedIn(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
  ): Promise<Boolean> {

    try {
      const rut = currentUserProfile[securityId];
      var user = await this.userRepository.findOne({where: {rut: rut}});
      if (user) {
        return true;
      } 
      throw new HttpErrors.Unauthorized();
    } catch (ex) {
      console.log(ex);
      throw new HttpErrors.Unauthorized();
    }

  }

  @get('/users/count', {
    responses: {
      '200': {
        description: 'Region model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<Number> {
    const users = await this.userRepository.find(filter);
    return users.length;
  }

  @del('/users/{rut}', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('rut') rut: string): Promise<void> {
    const users = await this.userRepository.find({ where : { rut : rut}});
    await this.userRepository.deleteById(users[0].id);
  }

  private async findRoleSlugOrId(id: string): Promise<Role> {
    const role = await this.roleRepository.searchSlug(id);
    if (role.length > 0) return role[0];
    return await this.roleRepository.findById(id);
  }
}
