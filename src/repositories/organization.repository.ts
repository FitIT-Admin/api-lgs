import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Organization, OrganizationRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class OrganizationRepository extends SlugRepositoryTitle<
  Organization,
  typeof Organization.prototype.id> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Organization, dataSource);
  }
}
