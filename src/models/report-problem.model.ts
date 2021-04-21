import {model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class ReportProblem extends SlugEntityTitle {
  @property({
    type: 'string',
    id: 1,
  })
  id: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
  })
  createdBy?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ReportProblem>) {
    super(data);
  }
}

export interface ReportProblemRelations {
  // describe navigational properties here
}

export type ReportProblemWithRelations = ReportProblem & ReportProblemRelations;
