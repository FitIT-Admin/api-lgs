import {DefaultCrudRepository} from '@loopback/repository';
import {Referer, RefererRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RefererRepository extends DefaultCrudRepository<
  Referer,
  typeof Referer.prototype.id,
  RefererRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Referer, dataSource);
  }
}
