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
    type: 'string'
  })
  birthdate: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
  })
  phone: string;

  @property({
    type: 'string',
    required: true,
  })
  nationality: string;


  @property.array(String)
  group: string[];


  @property({
    type: 'number',

  })
  failedAttempts: number;

  @property({
    type: 'string',
    required: true,
  })
  role: string;

  @property({
    type: 'string',
  })
  department: string;

  @property({
    type: 'string',
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
  })
  status: number;

  @property({
    type: 'string'
  })
  createdBy?: string;

  @property({
    type: 'string'
  })
  area : string;
  
  @property({
    type: 'string'
  })
  subDeparment : string;
  
  @property({
    type: 'string'
  })
  operacionApoyo: string;
  
  @property({
    type: 'string'
  })
  jefeDirecto : string;
  
  @property({
    type: 'string'
  })
  estamento : string;
  
  @property({
    type: 'string'
  })
  servicioOProyecto: string;
  
  @property({
    type: 'string'
  })
  fechaIngreso : string;
  
  @property({
    type: 'string'
  })
  emailAlternativo: string;
  
  @property({
    type: 'string'
  })
  direccion : string;
  
  @property({
    type: 'string'
  })
  contactoFamilia : string;
  
  @property({
    type: 'string'
  })
  contantoMovil : string;
  
  @property({
    type: 'string'
  })
  salud : string;
  
  @property({
    type: 'string'
  })
  afp : string;
  
  @property({
    type: 'string'
  })
  sueldo_base : string;
  
  @property({
    type: 'string'
  })
  cargasFamilia : string;
  
  @property({
    type: 'string'
  })
  kpi1 : string;
  
  @property({
    type: 'string'
  })
  kpi2 : string;
  
  @property({
    type: 'string'
  })
  kpi3 : string;
  
  @property({
    type: 'string'
  })
  kpi4 : string; 


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
