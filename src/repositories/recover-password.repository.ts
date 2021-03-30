import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {RecoverPassword, RecoverPasswordRelations} from '../models';

export type CredentialsChangePassword = {
  rut: string;
  password: string;
  hash: string;
};

export class RecoverPasswordRepository extends DefaultCrudRepository<
  RecoverPassword,
  typeof RecoverPassword.prototype.id,
  RecoverPasswordRelations
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(RecoverPassword, dataSource);
  }
}
