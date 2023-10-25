import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import { trxLogs, trxLogsRelations} from '../models';

export class trxLogsRepository extends DefaultCrudRepository<
  trxLogs,
  typeof trxLogs.prototype.userId,
  trxLogsRelations
> {
  constructor(
    @inject('datasources.db') protected db: juggler.DataSource,
  ) {
    super(trxLogs, db);
  }
}
