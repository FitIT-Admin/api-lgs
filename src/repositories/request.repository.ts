import {DefaultCrudRepository} from '@loopback/repository';
import {Request} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RequestRepository extends DefaultCrudRepository<
Request,
  typeof Request.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Request, dataSource);
  }
}