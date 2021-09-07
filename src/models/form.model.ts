import {model, property, Entity} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class Form extends SlugEntityTitle {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  
  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'boolean',
  })
  requireGeo: boolean;

  @property({
    type: 'string',
  })
  createdBy: string;

  @property({
    type: 'string',
  })
  customer: string;

  @property({
    type: 'string',
  })
  ot: string;

  @property({
    type: 'string',
  })
  group: string;

  @property({
    type: 'number',
  })
  
  status: number;

  @property({
    type: 'date',
  })
  publishAt?: Date;

  @property({
    type: 'string',
  })
  tipo_form: string;

  @property({
    type: 'date',
  })
  vigencyAt?: Date;

  @property({
    type: 'date',
  })
  suspendAt?: Date;

  @property({
    type: 'date',
  })
  deleteAt?: Date;

  @property.array(Object)
  questions: {title: string; alternatives: string[], tipo: string, condicional: string[],validations: string[]}[];

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Form>) {
    super(data);
  }
}

export interface FormRelations {
  // describe navigational properties here
}

export type FormWithRelations = Form & FormRelations;
