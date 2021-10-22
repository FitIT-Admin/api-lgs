import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Referer} from '../models';
import {RefererRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
export class RefererController {
  constructor(
    @repository(RefererRepository)
    public refererRepository : RefererRepository,
  ) {}

  @post('/referers')
  @response(200, {
    description: 'Referer model instance',
    content: {'application/json': {schema: getModelSchemaRef(Referer)}},
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Referer, {
            title: 'NewReferer',
            exclude: ['id'],
          }),
        },
      },
    })

    referer: Omit<Referer, 'id'>,
  ): Promise<Referer> {
    console.log("HOLA");
    console.log(referer);
    return this.refererRepository.create(referer);
  }

  @get('/referers/count')
  @response(200, {
    description: 'Referer model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async count(
    @param.where(Referer) where?: Where<Referer>,
  ): Promise<Count> {
    return this.refererRepository.count(where);
  }

  @get('/referers')
  @response(200, {
    description: 'Array of Referer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Referer, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Referer) filter?: Filter<Referer>,
  ): Promise<Referer[]> {
    return this.refererRepository.find(filter);
  }

  @patch('/referers')
  @response(200, {
    description: 'Referer PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Referer, {partial: true}),
        },
      },
    })
    referer: Referer,
    @param.where(Referer) where?: Where<Referer>,
  ): Promise<Count> {
    return this.refererRepository.updateAll(referer, where);
  }

  @get('/referers/{id}')
  @response(200, {
    description: 'Referer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Referer, {includeRelations: true}),
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.number('id') id: string,
    @param.filter(Referer, {exclude: 'where'}) filter?: FilterExcludingWhere<Referer>
  ): Promise<Referer> {
    return this.refererRepository.findById(id, filter);
  }

  @patch('/referers/{id}')
  @response(204, {
    description: 'Referer PATCH success',
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Referer, {partial: true}),
        },
      },
    })
    referer: Referer,
  ): Promise<void> {
    await this.refererRepository.updateById(id, referer);
  }

  @put('/referers/{id}')
  @response(204, {
    description: 'Referer PUT success',
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() referer: Referer,
  ): Promise<void> {
    await this.refererRepository.replaceById(id, referer);
  }

  @del('/referers/{rut}')
  @response(204, {
    description: 'Referer DELETE success',
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('rut') rut: string): Promise<void> {
    const referer = await this.refererRepository.find({ where : { rut : rut}});
    await this.refererRepository.deleteById(referer[0].id);
  }
}

