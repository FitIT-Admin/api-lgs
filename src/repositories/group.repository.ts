import {DefaultCrudRepository} from '@loopback/repository';
import {Group, GroupRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class GroupRepository extends DefaultCrudRepository<
  Group,
  typeof Group.prototype.id,
  GroupRelations
> {
  constructor(
    @inject('datasources.') dataSource: DbDataSource,
  ) {
    super(Group, dataSource);
  }
}
