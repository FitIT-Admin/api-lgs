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
} from '@loopback/rest';
import {WorkOrder} from '../models';
import {WorkOrderRepository} from '../repositories';

export class WorkOrderController {
  constructor(
    @repository(WorkOrderRepository)
    public workOrderRepository : WorkOrderRepository,
  ) {}

  @post('/work-orders', {
    responses: {
      '200': {
        description: 'WorkOrder model instance',
        content: {'application/json': {schema: getModelSchemaRef(WorkOrder)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WorkOrder, {
            title: 'NewWorkOrder',
            exclude: ['id'],
          }),
        },
      },
    })
    workOrder: Omit<WorkOrder, 'id'>,
  ): Promise<WorkOrder> {
    return this.workOrderRepository.create(workOrder);
  }

  @get('/work-orders/count', {
    responses: {
      '200': {
        description: 'WorkOrder model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(WorkOrder) where?: Where<WorkOrder>,
  ): Promise<Count> {
    return this.workOrderRepository.count(where);
  }

  @get('/work-orders', {
    responses: {
      '200': {
        description: 'Array of WorkOrder model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(WorkOrder, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(WorkOrder) filter?: Filter<WorkOrder>,
  ): Promise<WorkOrder[]> {
    return this.workOrderRepository.find(filter);
  }

  @patch('/work-orders', {
    responses: {
      '200': {
        description: 'WorkOrder PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WorkOrder, {partial: true}),
        },
      },
    })
    workOrder: WorkOrder,
    @param.where(WorkOrder) where?: Where<WorkOrder>,
  ): Promise<Count> {
    return this.workOrderRepository.updateAll(workOrder, where);
  }

  @get('/work-orders/{id}', {
    responses: {
      '200': {
        description: 'WorkOrder model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(WorkOrder, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(WorkOrder, {exclude: 'where'}) filter?: FilterExcludingWhere<WorkOrder>
  ): Promise<WorkOrder> {
    return this.workOrderRepository.findById(id, filter);
  }

  @patch('/work-orders/{id}', {
    responses: {
      '204': {
        description: 'WorkOrder PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(WorkOrder, {partial: true}),
        },
      },
    })
    workOrder: WorkOrder,
  ): Promise<void> {
    await this.workOrderRepository.updateById(id, workOrder);
  }

  @put('/work-orders/{id}', {
    responses: {
      '204': {
        description: 'WorkOrder PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() workOrder: WorkOrder,
  ): Promise<void> {
    await this.workOrderRepository.replaceById(id, workOrder);
  }

  @del('/work-orders/{id}', {
    responses: {
      '204': {
        description: 'WorkOrder DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.workOrderRepository.deleteById(id);
  }
}
