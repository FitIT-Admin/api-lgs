import {model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class Question extends TimestampEntity {
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
  form: string;

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

  constructor(data?: Partial<Question>) {
    super(data);
  }
}

export interface QuestionRelations {
  // describe navigational properties here
}

export type QuestionWithRelations = Question & QuestionRelations;
