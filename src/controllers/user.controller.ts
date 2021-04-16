import {
  authenticate, TokenService,
  UserService
} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Filter,
  FilterExcludingWhere,
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
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

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
    return this.userRepository.create(user);
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
    await this.userRepository.replaceById(users[0].id, users[0]);
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
  ): Promise<{token: string}> {

    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile);
    await this.auditAuthenticationRepository.create(registerAuditAuth(user.id, 1));
    return {token};
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
  ): Promise<Object> {

    try {
      const rut = currentUserProfile[securityId];
      var user = await this.userRepository.findOne({where: {rut: rut}});
      if (user) {
        var response: IsLoggedIn = {
          valid: true,
          profile: user
        }
        return response;
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
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users/activate/{hash}', {
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              type: 'String'
            },
          },
        },
      },
    },
  })
  async checkHash(@param.path.string('hash') hash: string): Promise<String> {
    let decodeHash = {
      user: "",
      name: "",
      date: ""
    };
    decodeHash = await this.verifyToken(hash);
    var recoverPassword = await this.recoverPasswordRepository.find({where: {hash: hash, active: 1, user: decodeHash.user}});
    var user = await this.userRepository.findById(decodeHash.user);

    if ((recoverPassword.length > 0) && (user.length == 1 && user.status == 0)) {
      user.status = 1;
      recoverPassword[0].active = true;
      await this.userRepository.updateById(user.id, user);
      await this.recoverPasswordRepository.updateById(recoverPassword[0].id, recoverPassword[0]);
      if (user.email) {
        this.sendAccountAtivatedEmail(user.email, user.name + " " + user.lastName);
      }

      await this.auditActionsRepository.create(registerAuditAction(user.id, "Activacion de cuenta de usuario: " + user.rut));
      return decodeHash.name.toString();
    }
    throw new HttpErrors.Conflict(
      `sign-in.token_invalid`,
    );
  }

  async sendAccountAtivatedEmail(emailUser: string, fullnameUser: string) {
    const mailOptions = {
      from: this.emailManager.getFromAddress(),
      to: emailUser,
      subject: "Cuenta de Usuario activada",
      html: this.emailManager.getHTMLAccountActivatedUser(fullnameUser)
    };

    this.emailManager.sendMail(mailOptions).then(function (res: any) {
      console.log("Successfully sent: " + mailOptions.subject + " to: " + mailOptions.to);
      return {message: `Successfully sent register mail to ${emailUser}`};
    }).catch(function (err: any) {
      Sentry.captureException(err);
      console.log(err);
      throw new HttpErrors.UnprocessableEntity(`Error in sending E-mail to ${emailUser}`);
    });
  }

  async generateActivationToken(rut: string, requestedDate: string, name: string, lastName: string): Promise<string> {

    const activationToken = {
      rut: rut,
      name: name + " " + lastName,
      date: requestedDate
    }

    let token: string;
    this.jwtExpiresIn = "86400"; // 1 days
    try {
      token = await signAsync(activationToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      console.log(error);
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }

  async verifyToken(token: string): Promise<any> {
    if (!token) {
      throw new HttpErrors.Conflict(
        `sign-in.token_invalid`,
      );
    }

    let data = {
      rut: "",
      name: "",
      date: ""
    };

    try {
      // decode user profile from token
      const decodedToken = await verifyAsync(token, this.jwtSecret);
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      data = Object.assign(
        {
          rut: decodedToken.rut,
          name: decodedToken.name,
          date: decodedToken.date
        },
      );
    } catch (error) {
      console.log(error);
      throw new HttpErrors.Unauthorized(
        `sign-in.token_invalid`,
      );
    }
    return data;
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
}
