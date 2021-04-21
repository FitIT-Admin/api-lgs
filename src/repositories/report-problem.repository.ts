import {inject} from '@loopback/core';
import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {DbDataSource} from '../datasources';
import {ReportProblem} from '../models';

export class ReportProblemRepository extends SlugRepositoryTitle<
ReportProblem,
  typeof ReportProblem.prototype.id
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ReportProblem, dataSource);
  }
}
