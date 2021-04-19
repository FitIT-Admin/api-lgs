import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Department, DepartmentRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class DepartmentRepository extends SlugRepositoryTitle<
  Department,
  typeof Department.prototype.id> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Department, dataSource);
  }
}
