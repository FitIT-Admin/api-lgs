import {
  Filter,
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {Charge} from '../models';
import {ChargeRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';

export class Chargeontroller {
  constructor(
    @repository(ChargeRepository)
    public chargeRepository : ChargeRepository,
  ) {}

  @get('/charges', {
    responses: {
      '200': {
        description: 'Array of Charge model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Charge, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Charge) filter?: Filter<Charge>,
  ): Promise<Charge[]> {
    return this.chargeRepository.find(filter);
  }

  @get('/charges/{slug}', {
    responses: {
      '200': {
        description: 'Charge model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Charge, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<Charge> {
    return await this.findSlugOrId(slug);
  }

  private async findSlugOrId(id: string): Promise<Charge> {
    const charge = await this.chargeRepository.searchSlug(id);
    if (charge.length > 0) return charge[0];
    return await this.chargeRepository.findById(id);
  }
}
