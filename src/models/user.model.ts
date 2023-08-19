import {hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from '../models';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class User extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  role: string;

  @property({
    type: 'string',
    required: true,
  })
  lastName: string;

  @property({
    type: 'string',
    required: true,
  })
  secondLastName: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'number',

  })
  failedAttempts: number;

  @property({
    type: 'number',
  })
  status: number;

  /*@property.array(Object)
  companies: {rut: string, name: string, direction: string, phone: string, accountNumber: number, accountType: string, bank: string, status: number}[];*/

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
