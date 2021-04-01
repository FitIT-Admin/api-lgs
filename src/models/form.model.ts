import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';
import {Question} from './question.model';

@model()
export class Form extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  createdBy: string;

  @property({
    type: 'string',
    required: true,
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
    required: true,
  })
  
  status: number;

  @property({
    type: 'date',
  })
  publishAt?: Date;

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

  @property.array(Question)
  question: Question[];
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
