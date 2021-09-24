import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {UserScoreDetail} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class UserScoreDetailRepository extends SlugRepositoryTitle<
UserScoreDetail,
  typeof UserScoreDetail.prototype.id  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(UserScoreDetail, dataSource);
  }
 
}