import {hasOne, model, property} from '@loopback/repository';
import {TimestampEntity} from '../lib/timestamp-entity';

@model()
export class WorkOrder extends TimestampEntity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  idOT: string

  @property({
    type: 'string'  })
  actividad: string

  @property({
    type: 'string'  })
  inicio: string
  
  @property({
    type: 'string'  })
  fin: string

  @property({
    type: 'string'  })
  estadoOt: string
  
  @property({
    type: 'string'  })
  nombre_cliente: string;
  
  @property({
    type: 'string'  })
  rut_cliente: string;
  
  @property({
    type: 'string'  })
  domicilio_cliente: string;
  
  @property({
    type: 'string'  })
  nombre_tecnico: string;
  
  @property({
    type: 'string'  })
  rut_tecnico: string;
  
  @property({
    type: 'string'  })
  codigo_tecnico: string;
  
  @property({
    type: 'string'  })
  email_cliente: string;
  
  @property({
    type: 'string'  })
  emailTecnico: string;
  
  @property({
    type: 'string'  })
  nombre_ayudante: string;
  
  @property({
    type: 'string'  })
  codigo_ayudante: string;
  
  @property({
    type: 'string'  })
  rut_ayudante: string;
  
  @property({
    type: 'string'  })
  planInternet: string;
  
  @property({
    type: 'string'  })
  red: string;
  
  @property({
    type: 'string'  })
  ssid: string;
  
  @property({
    type: 'string'  })
  password: string;
  
  @property({
    type: 'string'  })
  nacionalSubida: string;
  
  @property({
    type: 'string'  })
  nacionalBajada: string;
  
  @property({
    type: 'string'  })
  interSubida: string;
  
  @property({
    type: 'string'  })
  interBajada: string;
  
  @property({
    type: 'string'  })
  estadoReplay: string;
  
  @property({
    type: 'string'  })
  estadoVod: string;
  
  @property({
    type: 'string'  })
  estadoEos: string;
  
  @property({
    type: 'string'  })
  faseTierra: string;

  @property({
    type: 'string'  })
  faseNeutro: string;

  @property({
    type: 'string'  })
  neutroTierra: string;

  @property({
    type: 'string'  })
  tierraCliente: string;

  @property({
    type: 'string'  })
  filtroHUM: string;

  @property({
    type: 'string'  })
  tramoFalla: string;

  @property({
    type: 'string'  })
  riesgoElectrico: string;

  @property({
    type: 'string'  })
  observaciones: string;

  @property({
    type: 'string'  })
  recepcion_trabajos: string;

  @property({
    type: 'string'  })
  cierre_comercial: string;

  @property({
    type: 'string'  })
  nombre_recepcion: string;

  @property({
    type: 'string'  })
  rut_recepcion: string;

  @property({
    type: 'string'  })
  vinculo: string;

  @property({
    type: 'string'  })
  trabajosTecnico: string;

  @property({
    type: 'string'  })
  tv: string;

  @property({
    type: 'string'  })
  telfn: string;

  @property({
    type: 'string'  })
  materialNoS: string;

  @property({
    type: 'string'  })
  materialS: string;
  
  @property({
    type: 'string'  })
  materialTOA: string;
  
  @property({
    type: 'string'  })
  carta_titularNombre: string;
  
  @property({
    type: 'string'  })
  carta_titularRut: string;
  
  @property({
    type: 'string'  })
  carta_correo: string
  
  @property({
    type: 'string'  })
  fechaCreacion: string

  @property({
    type: 'string'  })
  statusMailstatusKWCC: string

  


  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<WorkOrder>) {
    super(data);
  }
}

export interface WorkOrderRelations {
  // describe navigational properties here
}

export type WorkOrderithRelations = WorkOrder & WorkOrderRelations;
