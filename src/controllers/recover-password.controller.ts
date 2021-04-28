import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {
  get, getModelSchemaRef,



  HttpErrors, param, post,


  put,

  requestBody
} from '@loopback/rest';
import * as Sentry from '@sentry/node';
import {promisify} from 'util';
import {EmailManagerBindings, PasswordHasherBindings, TokenServiceBindings} from '../keys';
import {RecoverPassword} from '../models';
import {AuditActionsRepository, RecoverPasswordRepository, UserCredentialsRepository, UserRepository} from '../repositories';
import {CredentialsChangePassword} from '../repositories/recover-password.repository';
import {Credentials} from '../repositories/user.repository';
import {EmailManager} from '../services/email.service';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {registerAuditAction} from '../services/validator';
import {CredentialsRequestBody} from './specs/user-controller.specs';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class RecoverPasswordController {

  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(RecoverPasswordRepository) public recoverPasswordRepository: RecoverPasswordRepository,
    @repository(UserCredentialsRepository) public userCredentialsRepository: UserCredentialsRepository,
    @repository(AuditActionsRepository)
    public auditActionsRepository: AuditActionsRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) { }

  @post('/recover-passwords', {
    responses: {
      '200': {
        description: 'RecoverPassword model instance',
        content: {'application/json': {schema: getModelSchemaRef(RecoverPassword)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RecoverPassword, {
            title: 'NewRecoverPassword',
            exclude: ['id'],
          }),
        },
      },
    })
    recoverPassword: Omit<RecoverPassword, 'id'>,
  ): Promise<Object> {

    // if (recoverPassword.rut.length < 9) {
    //   recoverPassword.rut = completeZero(recoverPassword.rut);
    // }

    const userExists = await this.userRepository.find({where: {rut: recoverPassword.user}});
    if (userExists.length == 0) {
      throw new HttpErrors.Conflict('sign-in.dntexist');
    }

    if (userExists[0].status == 0) {
      throw new HttpErrors.Unauthorized("sign-in.activation_required");
    }

    if (userExists[0].status == 3) {
      throw new HttpErrors.Unauthorized("sign-in.desactivated");

    }
    if (userExists[0].email == null || userExists[0].email == '') {
      throw new HttpErrors.Unauthorized("sign-in.not_email");
    } else {
      const recoverExists = await this.recoverPasswordRepository.find({where: {user: userExists[0].id, active: true}});
      if (recoverExists.length > 0) {
        recoverExists[0].active = false;
        await this.recoverPasswordRepository.updateById(recoverExists[0].id, recoverExists[0]);
      }
      var token: string = "";
      try {
        let forgotPassword: RecoverPassword = new RecoverPassword();
        forgotPassword.active = true;
        forgotPassword.user = userExists[0].id;
        const recoverPassword = await this.recoverPasswordRepository.create(forgotPassword);
        let date = recoverPassword.createdAt?.toString() || new Date().toString()
        token = await this.generateRecoverPassToken(userExists[0].id, date, userExists[0].name, userExists[0].lastName);
        forgotPassword.hash = token;
        forgotPassword.id = recoverPassword.id;
        await this.recoverPasswordRepository.updateById(forgotPassword.id, forgotPassword);
        this.sendEmail(userExists[0], token);
      } catch (ex) {
        Sentry.captureException(ex);
        console.log(ex);
        throw new HttpErrors.Conflict('errors.humanError');
      }
      await this.auditActionsRepository.create(registerAuditAction(userExists[0].id, "Solicita recuperacion de contraseña"));
      return {
        email: userExists[0].email,
        status: 1
      }
    }
  }

  @get('/recover-passwords/check-activate/{rut}', {
    responses: {
      '200': {
        description: 'Array of Currency model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(RecoverPassword, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async checkActivate(@param.path.string('rut') rut: string,
  ): Promise<Boolean> {
    const userExists = await this.userRepository.find({where: {rut: rut}});
    if (userExists.length == 0) {
      throw new HttpErrors.Conflict('sign-in.dntexist');
    }

    if (userExists[0].status == 0) {
      return true;
    }
    return false;
  }

  async sendEmail(user: any, token: String) {
    const mailOptions = {
      from: this.emailManager.getFromAddress(),
      to: user.email,
      subject: "Recuperacion de Clave",
      html: this.emailManager.getHTMLPasswordRecovery(user.name + " " + user.lastName, token)
    };

    this.emailManager.sendMail(mailOptions).then(function (res: any) {
      console.log("Successfully sent: " + mailOptions.subject + " to: " + mailOptions.to);
      return {message: `Successfully sent reset mail to ${user.email}`};
    }).catch(function (err: any) {
      console.log(err);
      Sentry.captureException(err);
      throw new HttpErrors.UnprocessableEntity("errors.humanError");
    });
  }

  async generateRecoverPassToken(user: string, requestedDate: string, name: string, lastName: string): Promise<string> {

    const recoverPasswordToken = {
      user: user,
      name: name + " " + lastName,
      date: requestedDate
    }

    let token: string;
    this.jwtExpiresIn = "86400"; // 1 day
    try {
      token = await signAsync(recoverPasswordToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }

  @get('/recover-passwords', {
    responses: {
      '200': {
        description: 'Array of Currency model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(RecoverPassword, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(RecoverPassword) filter?: Filter<RecoverPassword>,
  ): Promise<RecoverPassword[]> {
    return this.recoverPasswordRepository.find(filter);
  }


  @post('/recover-passwords/set', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': Object,
            },
          },
        },
      },
    },
  })
  async setPassword(@requestBody(CredentialsRequestBody) credentials: Credentials): Promise<Boolean> {

    try {

      const users = await this.userRepository.find( { where : { rut : credentials.rut }});
      var user = users[0];
      if (user.status == 3) {
        throw new HttpErrors.Unauthorized("sign-in.desactivated");
      }
      if (user.status == 0) {
        const previousCredentials = await this.userCredentialsRepository.find({where: {userId: credentials.rut}});
        if (previousCredentials.length > 0) {
          await this.userCredentialsRepository.deleteById(previousCredentials[0].id);
        }
        // encrypt the password
        const password = await this.passwordHasher.hashPassword(
          credentials.password,
        );

        // set the password
        await this.userRepository.userCredentials(user.rut).create({password});
        user.status = 1;
        await this.userRepository.updateById(user.id, user);
        await this.auditActionsRepository.create(registerAuditAction(user.id, "Usuario cargado via script crea sus credenciales"));
        return true;
      } else {
        throw new HttpErrors.Conflict('errors.unathorized');
      }
    } catch (ex) {
      console.log(ex);
      throw new HttpErrors.Conflict('sign-in.dntexist');
    }
  }

  @put('/recover-passwords/update', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': Object,
            },
          },
        },
      },
    },
  })
  async updatePassword(@requestBody(CredentialsRequestBody) credentials: CredentialsChangePassword): Promise<Boolean> {
    let decodeHash = {
      user: "",
      name: "",
      date: ""
    };

    try {
      const user = await this.userRepository.findById(credentials.rut);
      if (user.status == 3) {
        throw new HttpErrors.Unauthorized("sign-in.desactivated");
      }

      decodeHash = await this.verifyToken(credentials.hash);
      try {
        var recoverPassword = await this.recoverPasswordRepository.findOne({where: {hash: credentials.hash, active: 1, user: credentials.rut}});
        if (recoverPassword != undefined && (credentials.rut != recoverPassword.user.toString() || credentials.hash != recoverPassword.hash)) {
          throw new HttpErrors.Conflict(`sign-in.token_invalid`);
        }

        if (recoverPassword != undefined && (user.status == 0 || user.status == 1 || user.status == 2)) {
          // encrypt the password
          const password = await this.passwordHasher.hashPassword(
            credentials.password,
          );

          // remove old password if exists
          const previousCredentials = await this.userCredentialsRepository.find({where: {userId: credentials.rut}});
          if (previousCredentials.length > 0) {
            await this.userCredentialsRepository.deleteById(previousCredentials[0].id);
          }

          // set the new password
          await this.userRepository.userCredentials(credentials.rut).create({password});
          user.status = 1;
          await this.userRepository.updateById(user.id, user);
          recoverPassword.active = false;
          await this.recoverPasswordRepository.updateById(recoverPassword.id, recoverPassword)
          await this.auditActionsRepository.create(registerAuditAction(user.id, "Cambia contraseña mediante link de recuperacion"));

          return true;
        } else {
          throw new HttpErrors.Conflict('errors.unathorized');
        }
      } catch (ex) {
        throw new HttpErrors.Conflict(`sign-in.token_invalid`);
      }
    } catch (ex) {
      throw new HttpErrors.Conflict('sign-in.dntexist');
    }
  }

  @get('/recover-passwords/check/{hash}', {
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
  async checkHash(@param.path.string('hash') hash: string): Promise<Object> {
    let decodeHash = {
      user: "",
      name: "",
      date: ""
    };
    decodeHash = await this.verifyToken(hash);
    var hashExists = await this.recoverPasswordRepository.find({where: {hash: hash, active: true, user: decodeHash.user}});

    const response = {
      user: decodeHash.user.toString()
    }
    if (hashExists.length > 0) {
      return response;
    }
    throw new HttpErrors.Conflict(
      `sign-in.token_invalid`,
    );
  }

  async verifyToken(token: string): Promise<any> {
    if (!token) {
      throw new HttpErrors.Conflict(
        `sign-in.token_invalid`,
      );
    }

    let data = {
      user: "",
      name: "",
      date: ""
    };

    try {
      // decode user profile from token
      const decodedToken = await verifyAsync(token, this.jwtSecret);
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      data = Object.assign(
        {
          user: decodedToken.user,
          name: decodedToken.name,
          date: decodedToken.date
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `sign-in.token_invalid`,
      );
    }
    return data;
  }
}