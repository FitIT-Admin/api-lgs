import {DefaultCrudRepository} from '@loopback/repository';
import {AuditActions, AuditActionsRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AuditActionsRepository extends DefaultCrudRepository<
  AuditActions,
  typeof AuditActions.prototype.id,
  AuditActionsRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(AuditActions, dataSource);
  }
}
