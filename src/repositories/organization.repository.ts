import {DefaultCrudRepository} from '@loopback/repository';
import {Organization, OrganizationRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class OrganizationRepository extends DefaultCrudRepository<
  Organization,
  typeof Organization.prototype.id,
  OrganizationRelations
> {
  constructor(
    @inject('datasources.') dataSource: DbDataSource,
  ) {
    super(Organization, dataSource);
  }
}
