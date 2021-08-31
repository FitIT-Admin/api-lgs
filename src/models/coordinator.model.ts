import {hasMany, hasOne, model, property} from '@loopback/repository';
import {SlugEntityTitle} from '../lib/slug-entity-title';

@model()
export class Coordinator extends SlugEntityTitle {
    @property({
      type: 'string',
      id: true,
    })
    id: string;
    
    @property({
        type: 'string'
    })
    name: string;
    
    @property({
      type: 'string'
    })
    coordinatorId: string;

    @property({
      type: 'string',
    })
    createdBy: string;    

    @property.array(String)
    subordinates: string[];

    constructor(data?: Partial<Coordinator>) {
        super(data);
      }
    }
