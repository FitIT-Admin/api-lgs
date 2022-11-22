import {DefaultCrudRepository} from '@loopback/repository';
import {Order, OrderRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class OrderRepository extends DefaultCrudRepository<
    Order,
    typeof Order.prototype.id,
    OrderRelations  
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Order, dataSource);
  }
}
