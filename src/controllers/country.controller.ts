import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param,


  patch, post,




  put,

  requestBody
} from '@loopback/rest';
import {Country} from '../models';
import {CountryRepository} from '../repositories';

export class CountryController {
  constructor(
    @repository(CountryRepository)
    public countryRepository: CountryRepository,
  ) { }

  @post('/countries', {
    responses: {
      '200': {
        description: 'Country model instance',
        content: {'application/json': {schema: getModelSchemaRef(Country)}},
      },
    },
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Country, {
            title: 'NewCountry',
            exclude: ['id'],
          }),
        },
      },
    })
    country: Omit<Country, 'id'>,
  ): Promise<Country> {
    return this.countryRepository.create(country);
  }

  @get('/countries/count', {
    responses: {
      '200': {
        description: 'Country model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Country) where?: Where<Country>,
  ): Promise<Count> {
    return this.countryRepository.count(where);
  }

  @get('/countries', {
    responses: {
      '200': {
        description: 'Array of Country model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Country, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Country) filter?: Filter<Country>,
  ): Promise<Country[]> {
    return this.countryRepository.find(filter);
  }

  @get('/countries/{id}', {
    responses: {
      '200': {
        description: 'Country model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Country, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Country, {exclude: 'where'}) filter?: FilterExcludingWhere<Country>
  ): Promise<Country> {
    return this.countryRepository.findById(id, filter);
  }

  @patch('/countries/{id}', {
    responses: {
      '204': {
        description: 'Country PATCH success',
      },
    },
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Country, {partial: true}),
        },
      },
    })
    country: Country,
  ): Promise<void> {
    await this.countryRepository.updateById(id, country);
  }

  @put('/countries/{id}', {
    responses: {
      '204': {
        description: 'Country PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() country: Country,
  ): Promise<void> {
    await this.countryRepository.replaceById(id, country);
  }

  @del('/countries/{id}', {
    responses: {
      '204': {
        description: 'Country DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.countryRepository.deleteById(id);
  }
}
