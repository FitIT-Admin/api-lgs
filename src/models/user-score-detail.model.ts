import {hasOne, model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class UserScoreDetail extends SlugEntityTitle {
  @property({
    type: 'string',
    id: true,
  })
  id: string;
  
  @property({
    type: 'string',
    required: true,
  })
  CODIGO: string;
  
  @property({
    type: 'string',
    required: true,
  })
  FECHAFIN: string;
  
  @property({
    type: 'string',
    required: true,
  })
  ORDEN: string;
  
  @property({
    type: 'string',
    required: true,
  })
  DIRECCIONCLIENTE: string;
  
  @property({
    type: 'string',
    required: true,
  })
  TRABAJO: string;
  
  @property({
    type: 'number',
    required: true,
  })
  puntosAS: number;
  
  @property({
    type: 'number',
    required: true,
  })
  puntosVTR: number;

  constructor(data?: Partial<UserScoreDetail>) {
    super(data);
  }
}


