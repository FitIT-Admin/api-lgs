import {DefaultCrudRepository} from '@loopback/repository';
import {MySurveys} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class MySurveysRepository extends DefaultCrudRepository<
MySurveys,
  typeof MySurveys.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(MySurveys, dataSource);
  }
}