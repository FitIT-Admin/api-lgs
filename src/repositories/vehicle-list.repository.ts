import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { VehicleList, VehicleListRelations } from '../models/vehicle-list.model';

export class VehicleListRepository extends DefaultCrudRepository<
VehicleList,
    typeof VehicleList.prototype.id,
    VehicleListRelations  
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(VehicleList, dataSource);
  }
}
