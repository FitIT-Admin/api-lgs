import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Charge, ChargeRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ChargeRepository extends SlugRepositoryTitle<
Charge,
  typeof Charge.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Charge, dataSource);
  }
}
