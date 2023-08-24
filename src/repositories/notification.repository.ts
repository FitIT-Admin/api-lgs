import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';
import { Notification, NotificationRelations } from '../models/notification.model';

export class NotificationRepository extends DefaultCrudRepository<
  Notification,
  typeof Notification.prototype.id,
  NotificationRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Notification, dataSource);
  }
}
