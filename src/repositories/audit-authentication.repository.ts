import {DefaultCrudRepository} from '@loopback/repository';
import {AuditAuthentication, AuditAuthenticationRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AuditAuthenticationRepository extends DefaultCrudRepository<
  AuditAuthentication,
  typeof AuditAuthentication.prototype.id,
  AuditAuthenticationRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(AuditAuthentication, dataSource);
  }
}
