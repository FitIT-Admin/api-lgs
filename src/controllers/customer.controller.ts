import {
  Filter,
  FilterExcludingWhere,
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {Customer} from '../models';
import {CustomerRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';

export class CustomerController {
  constructor(
    @repository(CustomerRepository)
    public customerRepository : CustomerRepository,
  ) {}

  @get('/customers', {
    responses: {
      '200': {
        description: 'Array of Customer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Customer, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Customer) filter?: Filter<Customer>,
  ): Promise<Customer[]> {
    return this.customerRepository.find(filter);
  }

  @get('/customers/{slug}', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Customer, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string): Promise<Customer> {
    return await this.findSlugOrId(slug);
  }

  private async findSlugOrId(id: string): Promise<Customer> {
    const customer = await this.customerRepository.searchSlug(id);
    if (customer.length > 0) return customer[0];
    return await this.customerRepository.findById(id);
  }
}
