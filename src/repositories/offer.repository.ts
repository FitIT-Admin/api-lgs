import {DefaultCrudRepository} from '@loopback/repository'
import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Offer, OfferRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class OfferRepository extends DefaultCrudRepository<
Offer,
    typeof Offer.prototype.id,
    OfferRelations
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Offer, dataSource);
  }
}
