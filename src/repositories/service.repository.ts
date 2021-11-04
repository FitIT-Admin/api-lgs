import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { Service, ServiceRelations } from '../models/service.model';

export class ServiceRepository extends DefaultCrudRepository<
  Service,
  typeof Service.prototype.id,
  ServiceRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Service, dataSource);
  }
}
