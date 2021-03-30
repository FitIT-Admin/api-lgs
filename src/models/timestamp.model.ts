import {Entity, property} from '@loopback/repository';

/*
 * Custom entity that adds createdAt and updatedAt properties to models
 */

export class TimestampEntity extends Entity {
  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: Date;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt?: Date;
}
