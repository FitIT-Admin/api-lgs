import {DefaultCrudRepository} from '@loopback/repository';
import {Commune, CommuneRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CommuneRepository extends DefaultCrudRepository<
  Commune,
  typeof Commune.prototype.id,
  CommuneRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Commune, dataSource);
  }
}
