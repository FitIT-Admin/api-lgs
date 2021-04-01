import {DefaultCrudRepository} from '@loopback/repository';
import {Privilege, PrivilegeRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class PrivilegeRepository extends DefaultCrudRepository<
  Privilege,
  typeof Privilege.prototype.id,
  PrivilegeRelations
> {
  constructor(
    @inject('datasources.') dataSource: DbDataSource,
  ) {
    super(Privilege, dataSource);
  }
}
