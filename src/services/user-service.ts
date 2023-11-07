// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {User} from '../models/user.model';
import {AuditActionsRepository, AuditAuthenticationRepository} from '../repositories';
import {Credentials, UserRepository} from '../repositories/user.repository';
import {registerAuditAction, registerAuditAuth} from '../services/validator';
import {PasswordHasher} from './hash.password.bcryptjs';

export class MyUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AuditAuthenticationRepository) public auditAuthenticationRepository: AuditAuthenticationRepository,
    @repository(AuditActionsRepository) public auditActionsRepository: AuditActionsRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) { }

  async verifyCredentials(credentials: Credentials): Promise<User> {
    //console.log("verifyCredentials");
    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!foundUser) {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Not Found: '+credentials.email);
      throw new HttpErrors.Unauthorized("sign-in.dntexist");
    } else if (foundUser.status == 2) {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Bloqued: '+credentials.email);
      throw new HttpErrors.Unauthorized("Actualmente su usuario esta bloqueado, comuniquese con un administrador");
    } else if (foundUser.status == 3) {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Deactivated: '+credentials.email);
      throw new HttpErrors.Unauthorized("Actualmente su usuario esta desactivado, comuniquese con un administrador");
    } else if (foundUser.status == 5) {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Status 5: '+credentials.email);
      throw new HttpErrors.Unauthorized("sign-in.withoutcred");
    } else if (foundUser.status == -1) {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Deleted: '+credentials.email);
      throw new HttpErrors.Unauthorized("Actualmente su usuario esta desactivado, comuniquese con un administrador");
    } else if (foundUser.status == 1 || foundUser.status == 0) {
      const credentialsFound = await this.userRepository.findCredentials(foundUser.email);
      if (!credentialsFound) {
        console.log(new Date().toLocaleString('es-ES') + ', Login Failed - Credentials Not Found: '+credentials.email);
        throw new HttpErrors.Unauthorized("sign-in.withoutcred");
      }
      const passwordMatched = await this.passwordHasher.comparePassword(
        credentials.password,
        credentialsFound.password,
      );
      if (!passwordMatched) {
        let failedAttempts = foundUser.failedAttempts + 1
        if (failedAttempts < 3) {
          await this.userRepository.updateById(foundUser.id, {failedAttempts: failedAttempts})
          await this.auditAuthenticationRepository.create(registerAuditAuth(foundUser.id, 0));
          let attempts = 3 - failedAttempts;
          console.log(new Date().toLocaleString('es-ES') + ', ' + credentialsFound.userId + ', Login Failed - attempts:'+ attempts.toString());
          throw new HttpErrors.Unauthorized("Contraseña incorrecta, le quedan " + attempts.toString() + " intentos.");
        } else {
          /** Bloqued User */
          console.log(new Date().toLocaleString('es-ES') + ', ' + credentialsFound.userId + ', Login Failed - User now Blocked');
          await this.userRepository.updateById(foundUser.id, {status: 2, failedAttempts: 3})
          await this.auditActionsRepository.create(registerAuditAction(foundUser.id, "Cuenta bloqueada por intentos falladios"));
          throw new HttpErrors.Unauthorized("Cuenta bloqueada por intentos fallidos");
        }
      } else {
        console.log(new Date().toLocaleString('es-ES') + ', ' + credentialsFound.userId + ', Login OK');
        await this.userRepository.updateById(foundUser.id, {failedAttempts: 0})
      }
      return foundUser;
    } else {
      console.log(new Date().toLocaleString('es-ES') + ', Login Failed - User Status Unknown: '+credentials.email);
      throw new HttpErrors.Unauthorized("Usuario con estado desconocido, comuniquese con un administrador");
    }
  }

  convertToUserProfile(user: User): UserProfile {
    // since first name and lastName are optional, no error is thrown if not provided
    let userName = '';
    if (user.firstName) userName = `${user.firstName}`;
    if (user.lastName)
      userName = user.firstName
        ? `${userName} ${user.lastName}`
        : `${user.lastName}`;
    const userProfile = {
      [securityId]: user.email,
      name: userName,
      id: user.email
    };

    return userProfile;
  }
}
