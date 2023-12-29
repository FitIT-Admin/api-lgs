import { authenticate } from '@loopback/authentication';
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
  HttpErrors,
} from '@loopback/rest';
import {trxLogs} from '../models';
import {trxLogsRepository} from '../repositories';

export class trxLogsController {
  constructor(
    @repository(trxLogsRepository)
    public trxLogsRepository : trxLogsRepository,
  ) {}

  @post('/trx-logs')
  @response(200, {
    description: 'trxLogs model instance',
    content: {'application/json': {schema: getModelSchemaRef(trxLogs)}},
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(trxLogs, {
            title: 'NewTrxLogs',
            
          }),
        },
      },
    })
    trxLogs: trxLogs,
  ): Promise<trxLogs> {
    return this.trxLogsRepository.create(trxLogs);
  }

  @get('/trx-logs/count')
  @response(200, {
    description: 'trxLogs model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async count(
    @param.where(trxLogs) where?: Where<trxLogs>,
  ): Promise<Count> {
    return this.trxLogsRepository.count(where);
  }

  @get('/trx-logs')
  @response(200, {
    description: 'Array of trxLogs model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(trxLogs, {includeRelations: true}),
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(trxLogs) filter?: Filter<trxLogs>,
  ): Promise<trxLogs[]> {
    return this.trxLogsRepository.find(filter);
  }

  @patch('/trx-logs')
  @response(200, {
    description: 'trxLogs PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authenticate('jwt')
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(trxLogs, {partial: true}),
        },
      },
    })
    trxLogs: trxLogs,
    @param.where(trxLogs) where?: Where<trxLogs>,
  ): Promise<Count> {
    return this.trxLogsRepository.updateAll(trxLogs, where);
  }

  @get('/trx-logs/{userId}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, {includeRelations: true}),
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('userId') userId: string,
    @param.filter(trxLogs, { exclude: 'where' }) filter?: FilterExcludingWhere<trxLogs>
  ): Promise<Array<trxLogs>> {

  /*Hacer una query a la collecion users donde firstName contenga el valor enviado. Por cada nombre encontrado se saca la ID y
  se pasan a una variable formando un arreglo. Ese arreglo será usado como filtro. Ej: /juanito/.*/

    const log = await this.trxLogsRepository.find({ where: {userId: userId}}, filter);
    return log;
  }

  @patch('/trx-logs/{id}')
  @response(204, {
    description: 'trxLogs PATCH success',
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(trxLogs, {partial: true}),
        },
      },
    })
    trxLogs: trxLogs,
  ): Promise<void> {
    await this.trxLogsRepository.updateById(id, trxLogs);
  }

  @put('/trx-logs/{id}')
  @response(204, {
    description: 'trxLogs PUT success',
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() trxLogs: trxLogs,
  ): Promise<void> {
    await this.trxLogsRepository.replaceById(id, trxLogs);
  }

  @del('/trx-logs/{id}')
  @response(204, {
    description: 'trxLogs DELETE success',
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.trxLogsRepository.deleteById(id);
  }

  @get('/trx-logs/module-list/{module}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, { includeRelations: true }),
      },
    },
  })
  @authenticate('jwt')
  async findByModule(
    @param.path.string('module') module: string,
    @param.filter(trxLogs, { exclude: 'where' }) filter?: FilterExcludingWhere<trxLogs>
  ): Promise<Array<trxLogs>> {
    const log = await this.trxLogsRepository.find({ where:{ module: { like : module } } }, filter);
    return log;
  }

  @get('/trx-logs/trx-list/{trxType}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, {includeRelations: true})
      }
    }
  })
  @authenticate('jwt')
  async findLogsByTrx(
    @param.path.string('trxType') trxType: string,
    @param.filter(trxLogs, { exclude: 'where' }) filter?: FilterExcludingWhere<trxLogs>
    ): Promise<Array<trxLogs>>{
    const logs = await this.trxLogsRepository.find({ where: { module: {like : trxType}}}, filter);
    return logs;
  }

  @get('/trx-logs/list-by-dates/{fecha1}/{fecha2}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, { includeRelations: true })
      }
    }
  })
  @authenticate('jwt')
  async findLogsByDates(
    @param.path.string('fecha1') fecha1: string,
    @param.path.string('fecha2') fecha2: string
  ): Promise<trxLogs>{

      var logs: any = [];
      var match = [
        //{ $addFields: { createdAt: { $dateFromString: { dateString: { $concat: ["$createdAt", "T", "00:00:00", ".000Z"] }, "format": "%d/%m/%YT%H:%M:%S.%LZ" }}}},
        {
            $match: {
              $and : [
                { createdAt: { $gte: new Date(fecha1 + "T00:00:00.000Z"), $lte: new Date(fecha2 +"T23:59:59.999Z")}}
              ]
            }
        },
        {
          $sort: {createdAt: -1}
        }
      ]
      const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
      logs = await trx.aggregate(match).get();
      return logs;
  }

  @get('/trx-logs/list-by-date/{fecha}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, { includeRelations: true })
      }
    }
  })
  @authenticate('jwt')
  async findLogsByDate(
    @param.path.string('fecha') fecha: string,
  ): Promise<trxLogs>{
    var logs: any = [];
    var match = [
      {
        $match: {
          $and: [
              { createdAt: { $gte: new Date(fecha + "T00:00:00.000Z")}}
          ]
        }
      },
      {
        $sort: {createdAt: -1}
      }
    ]
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(match).get();
    return logs;
  }

  @get('/trx-logs/countWithParams', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async findLogsParams(
    @param.filter(trxLogs) filter?: Filter<trxLogs>
  ): Promise<{count: number}>{
    const logs = await this.trxLogsRepository.find(filter);
    //console.log("findLogsParams");
    //console.log({count: logs.length});
    return {count: logs.length};
  }
  
  
@get('/trx-logs/group-by-params', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async findLogsParamsGroup(
    @param.filter(trxLogs) filter?: Filter<trxLogs>
  ): Promise<any>{

    var logs: any = [];
    var match = [
      {
        $group: {
            '_id': {
                'module': "$module",
                'trxType' : '$trxType'
            },
            'cuenta': { $sum: 1 }
        }
      },
      {
        $sort: {module: -1}
      }
    ]
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(match).get();
    return logs;
  }
  
  @get('/trx-logs/find-all-modules', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async findAllModules(
  ): Promise<{_id: {module: string}, total: string}[]>{

    let logs: {_id: {module: string}, total: string}[] = [];
    const query = [
      {
        $group: {
            '_id': {
                'module': "$module",
            },
            'total': { $sum: 1 }
        }
      },
      {
        $sort: {total: -1}
      }
    ]
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(query).get();
    return logs;
  }

  @get('/trx-logs/module/{module}/find-all-trx-types', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async findAllTrxTypesOfModule(
    @param.path.string('module') module: string,
  ): Promise<{_id: {module: string}, total: string}[]>{

    let logs: {_id: {module: string}, total: string}[] = [];
    const query = [
      {
        $match: {
          module: module
        }
      },
      {
        $group: {
            '_id': {
                'trxType' : '$trxType'
            },
            'total': { $sum: 1 }
        }
      },
      {
        $sort: {total: -1}
      }
    ]
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(query).get();
    return logs;
  }

  @post('/trx-logs/count-with-filter', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async countWithFilter(
    @requestBody() parameters: { name: string, module: string, trxType: string, details: string, dateLogStart: string, dateLogEnd: string },
  ): Promise<{count: number}>{
    //console.log(parameters);
    /*let logs: trxLogs[] = [];
    const query = [
      {
        $match: {
          $and: [
            (parameters.module !== '') ? { module: parameters.module } : {},
            (parameters.trxType !== '') ? { trxType: parameters.trxType } : {},
            {createdAt: {$gte: new Date(parameters.dateLogStart), $lte: new Date(parameters.dateLogEnd)}}
          ]
        }
      },
    ];
    console.log(JSON.stringify(query));
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(query).get();
    return logs;*/
    let count: {count: number} = await this.trxLogsRepository.count({
      and: [
        (parameters.module !== '') ? { module: parameters.module } : {},
        (parameters.trxType !== '') ? { trxType: parameters.trxType } : {},
        {
          createdAt: {gte: parameters.dateLogStart}
        },
        {
          createdAt: {lte: parameters.dateLogEnd}
        }
      ]
    });
    //console.log(count);
    return (count) ? count : {count: 0};
  }

  @post('/trx-logs/find-with-filter/skip/{skip}/limit/{limit}', {
    responses: {
      '200' : {
        description: 'trxLogs model count with parameters',
        content: {'application/json': {schema: CountSchema}}
      }
    }
  })
  @authenticate('jwt')
  async findWithFilter(
    @param.path.string('skip') skip: string,
    @param.path.string('limit') limit: string,
    @requestBody() parameters: { name: string, module: string, trxType: string, details: string, dateLogStart: string, dateLogEnd: string },
  ): Promise<trxLogs[]>{
    //console.log(parameters);
    let logs: trxLogs[] = [];
    const query = [
      {
        $match: {
          $and: [
            (parameters.module !== '') ? { module: parameters.module } : {},
            (parameters.trxType !== '') ? { trxType: parameters.trxType } : {},
            {createdAt: {$gte: new Date(parameters.dateLogStart), $lte: new Date(parameters.dateLogEnd)}}
          ]
        }
      },
      {
        $skip: Number(skip)
      },
      {
        $limit: Number(limit)
      },
      {
        $sort: { createdAt: -1 }
      }
    ];
    //console.log(JSON.stringify(query));
    const trx = (this.trxLogsRepository.dataSource.connector as any).collection("trxLogs");
    logs = await trx.aggregate(query).get();
    return logs;
  }

/*
   @get('/trx-logs/listdate/{fecha1}')
  @response(200, {
    description: 'trxLogs model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(trxLogs, { includeRelations: true })
      }
    }
  })
  @authenticate('jwt')
  async findLogsByDate(
    @param.path.string('fecha1') fecha1: string,
    //@param.path.string('fecha2') fecha2: string,
  ): Promise<trxLogs>{   

    var fechaInicio;
    var fechaFin;
    fechaInicio = String(fecha1).replace(/\//g, '-').split('-');
    //fechaFin = String(fecha2).replace(/\//g, '-').split('-');

    const logs = await this.trxLogsRepository.find({ where: { createdAt: fecha1 } });
    return logs;

  }
  */
}
