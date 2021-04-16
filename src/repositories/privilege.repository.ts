import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Privilege} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class PrivilegeRepository extends SlugRepositoryTitle<
  Privilege,
  typeof Privilege.prototype.id> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Privilege, dataSource);
  }
}
