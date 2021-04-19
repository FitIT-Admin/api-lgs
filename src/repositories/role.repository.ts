import {inject} from '@loopback/core';
import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {DbDataSource} from '../datasources';
import {Role} from '../models';

export class RoleRepository extends SlugRepositoryTitle<
  Role,
  typeof Role.prototype.id  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Role, dataSource);
  }
}
