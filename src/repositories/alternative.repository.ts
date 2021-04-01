import {DefaultCrudRepository} from '@loopback/repository';
import {Alternative, AlternativeRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AlternativeRepository extends DefaultCrudRepository<
  Alternative,
  typeof Alternative.prototype.id,
  AlternativeRelations
> {
  constructor(
    @inject('datasources.') dataSource: DbDataSource,
  ) {
    super(Alternative, dataSource);
  }
}
