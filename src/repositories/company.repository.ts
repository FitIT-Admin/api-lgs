import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { Company, CompanyRelations } from '../models/company.model';

export class CompanyRepository extends DefaultCrudRepository<
Company,
    typeof Company.prototype.id,
    CompanyRelations  
  > {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Company, dataSource);
  }
}
