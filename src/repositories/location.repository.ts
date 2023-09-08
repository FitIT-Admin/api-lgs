import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { Location, LocationRelations } from '../models/location.model';

export class LocationRepository extends DefaultCrudRepository<
Location,
    typeof Location.prototype.id,
    LocationRelations  
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Location, dataSource);
  }
}
