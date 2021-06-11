import {DefaultCrudRepository} from '@loopback/repository';
import {WorkOrder} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class WorkOrderRepository extends DefaultCrudRepository<
  WorkOrder,
  typeof WorkOrder.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(WorkOrder, dataSource);
  }
}
