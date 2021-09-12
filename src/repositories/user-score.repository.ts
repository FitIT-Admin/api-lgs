import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {UserScore} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class UserScoreRepository extends SlugRepositoryTitle<
UserScore,
  typeof UserScore.prototype.id  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(UserScore, dataSource);
  }
 
}