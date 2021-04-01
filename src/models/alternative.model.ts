import {model, property} from '@loopback/repository';
import {TimestampEntity} from './timestamp.model';

@model()
export class Alternative extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  postedBy: string;

  @property({
    type: 'string',
    required: true
  })
  question: string;

  @property({
    type: 'string',
    required: true
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  status: number;

  @property({
    type: 'number',
    required: true
  })
  order: number;


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Alternative>) {
    super(data);
  }
}

export interface AlternativeRelations {
  // describe navigational properties here
}

export type AlternativeWithRelations = Alternative & AlternativeRelations;
