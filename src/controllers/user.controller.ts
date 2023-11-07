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
import {Role, trxLogs, User, UserCredentials} from '../models';
import {AuditActionsRepository, AuditAuthenticationRepository, Credentials, RecoverPasswordRepository, UserRepository, RoleRepository, RegisterCredentials, UserCredentialsRepository, trxLogsRepository} from '../repositories';
import {EmailManager} from '../services/email.service';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {registerAuditAction, registerAuditAuth} from '../services/validator';
import {
  CredentialsRequestBody, RegisterRequestBody
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
    @repository(trxLogsRepository) public trxLogsRepository: trxLogsRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AuditAuthenticationRepository) public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(AuditActionsRepository) public auditActionsRepository: AuditActionsRepository,
    @repository(RoleRepository) public roleRepository: RoleRepository,
    @repository(UserCredentialsRepository) public userCredentialsRepository: UserCredentialsRepository,
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

  @get('/users/{email}', {
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
    @param.path.string('email') email: string) : Promise<User | null> {
    const users = await this.userRepository.find({ where : { email : email}});
    return (users && users.length > 0) ? users[0] : null;
  }

  @put('/users/{email}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('email') email: string,
    @requestBody() user: User,
  ): Promise<void> {
    const users = await this.userRepository.find({ where : { email : email}});
    if (users && users.length > 0) {
      users[0].name = user.name;
      users[0].lastName = user.lastName;
      users[0].secondLastName = user.secondLastName;
      users[0].email = user.email;
      //users[0].phone = user.phone;
      //users[0].nationality = user.nationality;
      users[0].role = user.role;
      users[0].status = user.status;
      //users[0].charge = user.charge;
      //users[0].department = user.department;
      //users[0].group = user.group;
      //users[0].rutJefe = user.rutJefe;
      //users[0].cod_andes = user.cod_andes;
      //users[0].cod_tango = user.cod_tango;
      //users[0].rut = user.rut;
      await this.userRepository.updateById(users[0].id, users[0]);
      await this.createTrxLog(user, users[0], "update");
    }
  }

  @put('/users/status/{email}/{status}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  @authenticate('jwt')
  async changeStatus(
    @param.path.string('email') email: string,
    @param.path.number('status') status: number,
  ): Promise<void> {
    const users = await this.userRepository.find({ where : { email : email}});
    if (users && users.length > 0) {
      users[0].status = status;
      await this.userRepository.replaceById(users[0].id, users[0]);
    }
  }

  @get('/users/current', {
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
  @authenticate('jwt')
  async current(@inject(SecurityBindings.USER) currentUserProfile: UserProfile): Promise<Object> {
    const email = currentUserProfile[securityId];
    var user = await this.userRepository.findOne({where: {email: email}});
    if (user){
      const role = await this.findRoleSlugOrId(user.role);

      return {
        email: user.email,
        name: user.name + " " + user.lastName,
        role: {
          slug: role.slug,
          name: role.title
        },
        privilege: role.privilege      
      };
    }
    throw new HttpErrors.Unauthorized("Usuario no registrado, favor contacte al administrador");    
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

    var user = await this.userRepository.findOne({where: {email: credentials.email}});
    if (user){
      const role = await this.findRoleSlugOrId(user.role);
      const verifyUser = await this.userService.verifyCredentials(credentials);
      const userProfile = this.userService.convertToUserProfile(verifyUser);
      const token = await this.jwtService.generateToken(userProfile);
      await this.auditAuthenticationRepository.create(registerAuditAuth(verifyUser.id, 1));
      return {
        name: user.name + " " + user.lastName,
        email: user.email,
        role: {
          slug: role.slug,
          name: role.title
        },
        privilege: role.privilege,
        token: token
      };
    } else {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Not Found: '+credentials.email);
    }
    throw new HttpErrors.Unauthorized("Usuario no registrado, debe crear una cuenta para iniciar sesión"); 
  }
  @post('/users/regist', {
    responses: {
      '200': {
        description: 'NewUser',
      },
    },
  })
  //@authenticate('jwt')
  async regist(
    //user: User,
    @requestBody(RegisterRequestBody) credentials: RegisterCredentials,
  ): Promise<any> {
    //try {
      const users = await this.userRepository.find( { where : { email : credentials.email }});
      if (users.length == 0) {
        const previousCredentials = await this.userCredentialsRepository.find({where: {userId: credentials.email}});
        if (previousCredentials.length > 0) {
          await this.userCredentialsRepository.deleteById(previousCredentials[0].id);
        }
        // encrypt the password
        const password = await this.passwordHasher.hashPassword(
          credentials.password,
        );
        // separar apellidos
        var lastNames = credentials.lastName.split(' ')
        var lastName;
        var secondLastName;
        if (lastNames.length > 1) {
          lastName = lastNames[0];
          secondLastName = lastNames[1]
        }
        else {
          lastName = credentials.lastName;
          secondLastName = credentials.lastName;
        }
        // Crear user
        var user = new User;
        var userCredentials = new UserCredentials;
        user.email = credentials.email;
        user.name = credentials.name;
        user.lastName = lastName;
        user.secondLastName = secondLastName;
        user.role = credentials.typeUser;
        user.failedAttempts = 0;
        user.status = (credentials.typeUser === 'taller' || credentials.typeUser === 'comercio') ? 0 : 1;
        var newUser = await this.userRepository.create(user);
        // Crear credenciales de user
        userCredentials.userId = newUser.email;
        userCredentials.password = password;
        var newUserCredentials = await this.userCredentialsRepository.create(userCredentials);
        // Registro de creacion de usuario y credenciales
        await this.auditActionsRepository.create(registerAuditAction(newUser.id, "Creacion de Usuario y credenciales"));
        await this.createTrxLog(user, null, 'create');
        return true;
      } else {
        await this.createTrxLog(users[0], null, 'repeated email');
        throw new HttpErrors.Conflict('El email ya se encuentra registrado en el sistema, intente con otro email');
      }
    //} catch (ex) {
    throw new HttpErrors.Conflict('sign-in.dntexist');
    //}
    
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
      const email = currentUserProfile[securityId];
      var user = await this.userRepository.findOne({where: {email: email}});
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

  @del('/users/{email}', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('email') email: string): Promise<void> {
    const users = await this.userRepository.find({ where : { email : email}});
    if (users && users.length > 0) {
      await this.userRepository.deleteById(users[0].id);
    }
  }

  private async findRoleSlugOrId(id: string): Promise<Role> {
    const role = await this.roleRepository.searchSlug(id);
    if (role.length > 0) return role[0];
    return await this.roleRepository.findById(id);
  }
  private async createTrxLog(userNew: User, userPre: User | null, type: string) {
    if (type === "update" && userPre) {
      let trxLog: trxLogs = new trxLogs();
      trxLog.createdAt = new Date().toISOString();
      trxLog.updatedAt = new Date().toISOString();
      trxLog.trxType = "UpdateUser";
      trxLog.module = "UsersWeb";
      trxLog.userId = userNew.email;
      trxLog.details = "createdAtNew:"+new Date()+",updatedAtNew:"+new Date()+",emailNew:"+userNew.email+",nameNew:"+userNew.name
      +",lastNameNew:"+userNew.lastName+",secondLastNameNew:"+userNew.secondLastName+",roleNew:"+userNew.role+",statusNew:"+userNew.status
      +
      "createdAtPre:"+userPre.createdAt+",updatedAtPre:"+userPre.updatedAt+",emailPre:"+userPre.email+",namePre:"+userPre.name
      +",lastNamePre:"+userPre.lastName+",secondLastNamePre:"+userPre.secondLastName+",rolePre:"+userPre.role+",statusPre:"+userPre.status;
      trxLog.logLevel = "info";
      await this.trxLogsRepository.create(trxLog);
    } else if (type === "create") {
      let trxLog: trxLogs = new trxLogs();
      trxLog.createdAt = new Date().toISOString();
      trxLog.updatedAt = new Date().toISOString();
      trxLog.trxType = "CreateUser";
      trxLog.module = "UsersWeb";
      trxLog.userId = userNew.email;
      trxLog.details = "createdAtNew:"+new Date()+",updatedAtNew:"+new Date()+",emailNew:"+userNew.email+",nameNew:"+userNew.name
      +",lastNameNew:"+userNew.lastName+",secondLastNameNew:"+userNew.secondLastName+",roleNew:"+userNew.role+",statusNew:"+userNew.status;
      trxLog.logLevel = "info";
      await this.trxLogsRepository.create(trxLog);
    } else if (type === "repeated email") {
      let trxLog: trxLogs = new trxLogs();
      trxLog.createdAt = new Date().toISOString();
      trxLog.updatedAt = new Date().toISOString();
      trxLog.trxType = "repeatedEmailUser";
      trxLog.module = "UsersWeb";
      trxLog.userId = userNew.email;
      trxLog.details = "createdAt:"+userNew.createdAt+",updatedAt:"+userNew.updatedAt+",email:"+userNew.email+",name:"+userNew.name
      +",lastName:"+userNew.lastName+",secondLastName:"+userNew.secondLastName+",role:"+userNew.role+",status:"+userNew.status;
      trxLog.logLevel = "info";
      await this.trxLogsRepository.create(trxLog);
    }
  }
}
