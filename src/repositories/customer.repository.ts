import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Customer, CustomerRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CustomerRepository extends SlugRepositoryTitle<
  Customer,
  typeof Customer.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Customer, dataSource);
  }
}
