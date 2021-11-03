import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { Promotion, PromotionRelations } from '../models/promotion.model';

export class PromotionRepository extends DefaultCrudRepository<
  Promotion,
  typeof Promotion.prototype.id,
  PromotionRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Promotion, dataSource);
  }
}
