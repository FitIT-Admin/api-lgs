import {model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class Notification extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  channel: string;

  @property({
    type: 'object',
    required: true,
  })
  recipient: {rut: string, email: string, phone: string};

  @property({
    type: 'object',
  })
  sender?: {rut: string, email: string, phone: string};

  @property({
    type: 'string',
  })
  title?: string;

  @property({
    type: 'string',
    required: true,
  })
  message?: string;

  @property({
    type: 'string',
  })
  link?: string;

  @property({
    type: 'Date',
    viewedDate: null
  })
  viewedDate: Date;

  @property({
    type: 'boolean',
    viewed: false
  })
  viewed: boolean;

  @property({
    type: 'number',
    pushAttempts: 0
  })
  pushAttempts: number;

  @property({
    type: 'boolean',
    send: false
  })
  send: boolean;

  @property({
    type: 'number',
  })
  status: number;

  [prop: string]: any;

  constructor(data?: Partial<Notification>) {
    super(data);
  }
}

export interface NotificationRelations {
  // describe navigational properties here
}

export type NotificationWithRelations = NotificationRelations & NotificationRelations;
