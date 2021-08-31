
import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Coordinator} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CoordinatorRepository extends SlugRepositoryTitle<
Coordinator,
  typeof Coordinator.prototype.id  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Coordinator, dataSource);
  }
}
