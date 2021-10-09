import {DefaultCrudRepository} from '@loopback/repository';
import {ClaimedPointsNDC} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ClaimedPointsNDCRepository extends DefaultCrudRepository<
ClaimedPointsNDC,
  typeof ClaimedPointsNDC.prototype.id  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ClaimedPointsNDC, dataSource);
  }
}
