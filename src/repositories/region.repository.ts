import {DefaultCrudRepository} from '@loopback/repository';
import {Region, RegionRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RegionRepository extends DefaultCrudRepository<
  Region,
  typeof Region.prototype.id,
  RegionRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Region, dataSource);
  }
}
