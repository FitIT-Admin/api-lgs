import {DefaultCrudRepository} from '@loopback/repository';
import {PrivilegeType, PrivilegeTypeRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class PrivilegeTypeRepository extends DefaultCrudRepository<
  PrivilegeType,
  typeof PrivilegeType.prototype.id,
  PrivilegeTypeRelations
> {
  constructor(
    @inject('datasources.') dataSource: DbDataSource,
  ) {
    super(PrivilegeType, dataSource);
  }
}
