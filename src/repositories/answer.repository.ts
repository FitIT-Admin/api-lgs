import {DefaultCrudRepository} from '@loopback/repository';
import {Answer, AnswerRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class AnswerRepository extends DefaultCrudRepository<
  Answer,
  typeof Answer.prototype.id,
  AnswerRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Answer, dataSource);
  }
}
