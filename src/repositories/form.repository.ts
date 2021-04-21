import {SlugRepositoryTitle} from '../lib/slug-repository.title';
import {Form} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class FormRepository extends SlugRepositoryTitle<
  Form,
  typeof Form.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Form, dataSource);
  }
}
