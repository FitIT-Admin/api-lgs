import {hasOne, model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class UserScore extends SlugEntityTitle {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string'
  })
  puntosVTR: string;

  @property({
    type: 'string',
    required: true,
  })
  puntosAS: string;

  @property({
    type: 'string',
  })
  codigo: string;

  @property({
    type: 'string'
  })
  periodo: string;


  constructor(data?: Partial<UserScore>) {
    super(data);
  }
}


