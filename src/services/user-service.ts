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

    const foundUser = await this.userRepository.findOne({
      where: {rut: credentials.rut},
    });

    if (!foundUser) {
      throw new HttpErrors.Unauthorized("sign-in.dntexist");
    } else if (foundUser.status == 0) {
      throw new HttpErrors.Unauthorized("sign-in.activation_required");
    } else if (foundUser.status == 2) {
      throw new HttpErrors.Unauthorized("sign-in.bloqued");
    } else if (foundUser.status == 3) {
      throw new HttpErrors.Unauthorized("sign-in.desactivated");
    } else if (foundUser.status == 5) {
      throw new HttpErrors.Unauthorized("sign-in.withoutcred");
    } else {
      const credentialsFound = await this.userRepository.findCredentials(foundUser.rut);
      if (!credentialsFound) {
        throw new HttpErrors.Unauthorized("sign-in.withoutcred");
      }

      if (foundUser.status == 1) {
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
            throw new HttpErrors.Unauthorized("sign-in.fail|" + attempts.toString());
          } else {
            /** Bloqued User */

            await this.userRepository.updateById(foundUser.id, {status: 2, failedAttempts: 3})
            await this.auditActionsRepository.create(registerAuditAction(foundUser.id, "Cuenta bloqueada por intentos falladios"));
            throw new HttpErrors.Unauthorized("sign-in.bloqued_attemps");
          }
        } else {
          await this.userRepository.updateById(foundUser.id, {failedAttempts: 0})
        }

      }

      return foundUser;
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
      [securityId]: user.rut,
      name: userName,
      id: user.rut,
      roles: user.roles,
    };

    return userProfile;
  }
}
