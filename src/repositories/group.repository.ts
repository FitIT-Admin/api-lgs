import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Group, GroupRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class GroupRepository extends SlugRepositoryTitle<
  Group,
  typeof Group.prototype.id> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Group, dataSource);
  }
}
