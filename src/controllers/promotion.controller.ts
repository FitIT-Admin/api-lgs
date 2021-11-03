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
import {authenticate} from '@loopback/authentication';
import { PromotionRepository } from '../repositories/promotion.repository';
import { Promotion } from '../models/promotion.model';
export class PromotionController {
  constructor(
    @repository(PromotionRepository)
    public promotionRepository : PromotionRepository,
  ) {}

  @post('/promotions')
  @response(200, {
    description: 'Promotion model instance',
    content: {'application/json': {schema: getModelSchemaRef(Promotion)}},
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Promotion, {
            title: 'NewPromotion',
            exclude: ['id'],
          }),
        },
      },
    })

    promotion: Omit<Promotion, 'id'>,
  ): Promise<Promotion> {
    return this.promotionRepository.create(promotion);
  }

  @get('/promotions/count')
  @response(200, {
    description: 'Promotion model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async count(
    @param.where(Promotion) where?: Where<Promotion>,
  ): Promise<Count> {
    return this.promotionRepository.count(where);
  }

  @get('/promotions')
  @response(200, {
    description: 'Array of Promotion model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Promotion, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Promotion) filter?: Filter<Promotion>,
  ): Promise<Promotion[]> {
    return this.promotionRepository.find(filter);
  }

  @patch('/promotions')
  @response(200, {
    description: 'Promotion PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Promotion, {partial: true}),
        },
      },
    })
    promotion: Promotion,
    @param.where(Promotion) where?: Where<Promotion>,
  ): Promise<Count> {
    return this.promotionRepository.updateAll(promotion, where);
  }

  @get('/promotions/{id}')
  @response(200, {
    description: 'Promotion model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Promotion, {includeRelations: true}),
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Promotion, {exclude: 'where'}) filter?: FilterExcludingWhere<Promotion>
  ): Promise<Promotion> {
    return this.promotionRepository.findById(id, filter);
  }

  @patch('/promotions/{id}')
  @response(204, {
    description: 'Promotion PATCH success',
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Promotion, {partial: true}),
        },
      },
    })
    promotion: Promotion,
  ): Promise<void> {
    await this.promotionRepository.updateById(id, promotion);
  }

  @put('/promotions/{id}')
  @response(204, {
    description: 'Promotion PUT success',
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() promotion: Promotion,
  ): Promise<void> {
    await this.promotionRepository.replaceById(id, promotion);
  }

  @del('/promotions/{id}')
  @response(204, {
    description: 'Promotion DELETE success',
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const promotion = await this.promotionRepository.find({ where : { id : id}});
    await this.promotionRepository.deleteById(promotion[0].id);
  }

}

