import {DefaultCrudRepository} from '@loopback/repository';
import {Request, User} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class RequestRepository extends DefaultCrudRepository<
Request,
  typeof Request.prototype.id
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Request, dataSource);
  }

  async getRequestReport(): Promise<any> {
    const data = await new Promise((resolve, reject) => {
      this.execute('Request', 'aggregate', [
        {
          $lookup:{
              from: "User",
              localField : "createdBy",
              foreignField : "rut",
              as : "createdByUser"
          }
        }
      ]);
    });
    return data;
  }

}
