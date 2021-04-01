import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from './timestamp.model';

@model()
export class User extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'date'
  })
  birthdate: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  group: string;

  @property({
    type: 'number',
    required: true,

  })
  failedAttempts: number;

  @property({
    type: 'string',
    required: true,
  })
  role: string;

  @property({
    type: 'string',
    required: true,
  })
  department: string;

  @property({
    type: 'string',
    required: true,
  })
  charge: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  rut: string;

  @property({
    type: 'string',
  })
  secondLastName: string;

  @property({
    type: 'number',
    required: true,
  })
  status: number;


  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
