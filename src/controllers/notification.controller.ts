import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
  } from '@loopback/repository';
  import {
    post,
    param,
    get,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
  } from '@loopback/rest';
  import {authenticate} from '@loopback/authentication';
  import { ObjectId } from 'mongodb';
import { NotificationRepository } from '../repositories/notification.repository';
import { Notification } from '../models/notification.model';

export class NotificationController {
    constructor(
      @repository(NotificationRepository) public notificationRepository : NotificationRepository
    ) {}
  
    @post('/notification')
    @response(200, {
      description: 'Notification model instance'
    })
    @authenticate('jwt')
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Notification, {
              title: 'NewNotification',
              exclude: ['id'],
            }),
          },
        },
      })
  
      notification: Omit<Notification, 'id'>,
    ): Promise<Notification> {
        notification.viewed = false;
        notification.viewedDate = null;
        return this.notificationRepository.create(notification);
    }
  
    @get('/notification/{rut}')
    @response(200, {
      description: 'get Notification with email',
    })
    @authenticate('jwt')
    async findByRut(
        @param.path.string('rut') rut: string
    ): Promise<any> {
      return this.notificationRepository.find({where: {recipent: {rut: rut}}});
    }
    @get('/notification/web/email/{email}')
    @response(200, {
      description: 'get Notification web with rut',
    })
    @authenticate('jwt')
    async findNotificationWebByEmail(
        @param.path.string('email') email: string
    ): Promise<{notifications: Notification[], timeCall: number}> {
      let notifications: Notification[] = await this.notificationRepository.find({where: {"recipient.email": email, channel: "Web", status: {$ne: -1}}});
      notifications.forEach(async notification => {
        // Se usa para controlar el tiempo en que expiran las notificaciones por día
        let expiryDays: number = Number(String(process.env.EXPIRY_NOTIFY_DAYS));
        if (expiryDays && notification.createdAt)  {
          let currentDate: Date = new Date();
          if (this.calculateDifferenceInDays(currentDate, notification.createdAt) >= expiryDays) {
            // Si expira la notificacion cambia de estado a -1 (expirado)
            notification.status = -1;
            await this.notificationRepository.updateById(notification.id, notification);  
          } else {
            notification.viewed = true;
            notification.viewedDate = new Date();
            notification.pushAttempts = notification.pushAttempts + 1;
            notification.send = true;
            await this.notificationRepository.updateById(notification.id, notification);
          }
        } else {
          notification.viewed = true;
          notification.viewedDate = new Date();
          notification.pushAttempts = notification.pushAttempts + 1;
          notification.send = true;
          await this.notificationRepository.updateById(notification.id, notification);
        }
      });
      notifications = await this.notificationRepository.find({where: {"recipient.email": email, channel: "Web", status: {$ne: -1}}, order: ["createdAt DESC"] });
      // Se usa para controlar el tiempo de llamada para actualizar notificaciones en segundos
      let timeCall: number = Number(String(process.env.CHECK_NOTIFY_INTERVAL));
      if (timeCall) {
        return {notifications: (notifications.length > 0) ? notifications : [], timeCall: timeCall * 1000};
      } else {
        return {notifications: (notifications.length > 0) ? notifications : [], timeCall: 300000};
      }
      
    }
    @get('/notification/web/{rut}')
    @response(200, {
      description: 'get Notification web with rut',
    })
    @authenticate('jwt')
    async findNotificationWebByRut(
        @param.path.string('rut') rut: string
    ): Promise<{notifications: Notification[], timeCall: number}> {
      let notifications: Notification[] = await this.notificationRepository.find({where: {"recipient.rut": rut, channel: "Web", status: {$ne: -1}}});
      notifications.forEach(async notification => {
        // Se usa para controlar el tiempo en que expiran las notificaciones por día
        let expiryDays: number = Number(String(process.env.EXPIRY_NOTIFY_DAYS));
        if (expiryDays && notification.createdAt)  {
          let currentDate: Date = new Date();
          if (this.calculateDifferenceInDays(currentDate, notification.createdAt) >= expiryDays) {
            // Si expira la notificacion cambia de estado a -1 (expirado)
            notification.status = -1;
            await this.notificationRepository.updateById(notification.id, notification);  
          } else {
            notification.viewed = true;
            notification.viewedDate = new Date();
            notification.pushAttempts = notification.pushAttempts + 1;
            notification.send = true;
            await this.notificationRepository.updateById(notification.id, notification);
          }
        } else {
          notification.viewed = true;
          notification.viewedDate = new Date();
          notification.pushAttempts = notification.pushAttempts + 1;
          notification.send = true;
          await this.notificationRepository.updateById(notification.id, notification);
        }
      });
      notifications = await this.notificationRepository.find({where: {"recipient.rut": rut, channel: "Web", status: {$ne: -1}}, order: ["createdAt DESC"] });
      // Se usa para controlar el tiempo de llamada para actualizar notificaciones en segundos
      let timeCall: number = Number(String(process.env.CHECK_NOTIFY_INTERVAL));
      if (timeCall) {
        return {notifications: (notifications.length > 0) ? notifications : [], timeCall: timeCall * 1000};
      } else {
        return {notifications: (notifications.length > 0) ? notifications : [], timeCall: 300000};
      }
      
    }

    @get('/notification/mail/{email}')
    @response(200, {
      description: 'get Notification mail with email',
    })
    @authenticate('jwt')
    async findNotificationMailByRut(
        @param.path.string('email') email: string
    ): Promise<any> {
      return this.notificationRepository.find({where: {"recipient.email": email, channel: "Mail", status: {$ne: -1}}});
    }

    @get('/notification/mail')
    @response(200, {
      description: 'get Notification SMS with rut',
    })
    @authenticate('jwt')
    async findNotificationMail_notSent(): Promise<any> {
      return this.notificationRepository.find({where: {channel: "Mail", status: {$ne: -1}, send: false}});
    }

    @get('/notification/sms/{email}')
    @response(200, {
      description: 'get Notification SMS with email',
    })
    @authenticate('jwt')
    async findNotificationSMSByRut(
        @param.path.string('email') email: string
    ): Promise<any> {
      return this.notificationRepository.find({where: {"recipient.email": email, channel: "SMS", status: {$ne: -1}}});
    }

    @get('/notification/sms')
    @response(200, {
      description: 'get Notification SMS with rut',
    })
    @authenticate('jwt')
    async findNotificationSMS_notSent(): Promise<any> {
      return this.notificationRepository.find({where: {channel: "SMS", status: {$ne: -1}, send: false}});
    }

    @get('/notification/{id}')
    @response(200, {
      description: 'get Notification with id',
    })
    @authenticate('jwt')
    async findById(
        @param.path.string('id') id: string
    ): Promise<any> {
      return this.notificationRepository.find({where: {_id: new ObjectId(id) }});
    }

    @put('/notification/update', {
        responses: {
          '204': {
            description: 'Notification PUT success',
          },
        },
      })
      @authenticate('jwt')
      async update(
        @requestBody() notification: Notification
      ): Promise<any> {
        await this.notificationRepository.updateById(notification.id, notification);
        return true;
      }

      @put('/notifications/readall/web/{email}')
      @response(200, {
        description: 'get Notification web with email',
      })
      @authenticate('jwt')
      async markAllRead(
          @param.path.string('email') email: string
      ): Promise<any> {
        let notifications = this.notificationRepository.find({where: {"recipient.email": email, channel: "Web", status: 0}});
        (await notifications).forEach(async notification => {
          notification.status = 1;
          await this.notificationRepository.updateById(notification.id, notification);
        });

        return true;
      }

      @del('/notification', {
        responses: {
          '204': {
            description: 'Notification DELETE success',
          },
        },
      })
      @authenticate('jwt')
      async deleteById(@requestBody() notification: Notification): Promise<void> {
        await this.notificationRepository.deleteById(notification.id, notification);
      }
      /**
       * Calcula diferencia entre dos fechas en dias
       * @param date1 fecha mayor
       * @param date2 fecha menor
       * @returns diferencia en dias
       */
      private calculateDifferenceInDays(date1: Date, date2: Date) {
        let difference: number = (Number(date1) - Number(date2)) / (1000 * 60 * 60 * 24);
        return Math.floor(difference);
      }
}
  
  