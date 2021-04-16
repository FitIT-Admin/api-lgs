import {model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class Answer extends TimestampEntity {
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
  alternative: string;


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Answer>) {
    super(data);
  }
}

export interface AnswerRelations {
  // describe navigational properties here
}

export type AnswerWithRelations = Answer & AnswerRelations;
