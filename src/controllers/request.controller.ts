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
  put,
  HttpErrors,
  requestBody,
} from '@loopback/rest';
import {Request, Form} from '../models';
import {RequestRepository, UserRepository, FormRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {EmailManager} from '../services/email.service';
import {
  EmailManagerBindings
} from '../keys';
import {createMySurveyPdf} from '../lib/build_pdf';
import * as fs from 'fs';
import { resolve } from 'dns';

const sgMail = require('@sendgrid/mail')

export class RequestController {
  constructor(
    @repository(RequestRepository)
    public requestRepository : RequestRepository,
    @repository(FormRepository)
    public formRepository : FormRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) {}

  @post('/request', {
    responses: {
      '200': {
        description: 'Request model instance',
        content: {'application/json': {schema: getModelSchemaRef(Request)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Request, {
            title: 'NewRequest',
            exclude: [''],
          }),
        },
      },
    })
    request: Omit<Request, ''>,
  ): Promise<Request> {
    const rut = currentUserProfile[securityId];
    let userCreator = await this.userRepository.findOne({ where : { rut : rut }});
    request.createdBy = rut;
    request.status = 0;
    if (request.tracks==null){
      request.tracks=[]
    }
    let track ={
        commentBy : rut,
        commentName : (userCreator!=null)? userCreator.name + userCreator.lastName : "",
        commentMail : (userCreator!=null)? userCreator.email : "" ,
        commentAt : new Date(),
        comment : {
          comment : "Creación del Ticket",
          assignTo : "",
          state : 0
        }
    };
    request.tracks.push(track);

    return this.requestRepository.create(request);
  }
  @authenticate('jwt')
  @get('/request/count', {
    responses: {
      '200': {
        description: 'Request model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Request) where?: Where<Request>,
  ): Promise<Count> {
    return this.requestRepository.count(where);
  }

  @get('/request', {
    responses: {
      '200': {
        description: 'Array of Requests model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Request, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Request) filter?: Filter<Request>,
  ): Promise<any[]> {
    /*
    if (!this.requestRepository.dataSource.connected) {
      console.log('in if condition... initialization not complete');
      await this.requestRepository.dataSource.connect();
    }
    const _requestCollection = (this.requestRepository.dataSource.connector as any).collection('Request');
    let filterStr = "{ \"match\" :" +JSON.stringify(filter!.where)+" }";
    filterStr = filterStr
      .replace("\"and\"","\"$and\"")
      .replace("\"lt\":","\"$lt\":new Date(")
      .replace("\"gt\":","\"$gt\":new Date(")
      .replace(/GMT-0300"}}/g,"GMT-0300\")}}")
    console.log(filterStr);

    let query:any[] = [
      {
        $lookup: {
          from: 'User',
          localField: 'createdBy',
          foreignField: 'rut',
          as: 'createdByUser',
        },
      },
      {
        $addFields : {
          statusDescription : {
            $function: {
              body: `function(estado){
                if (estado=="0"){
                  return "Abierto-Coordinador-Sin-Asignar";
                }else if (estado=="1"){
                  return "Abierto-Coordinador";
                }else if (estado=="2"){
                  return "Abierto-Analista-Sin-Asignar";
                }else if (estado=="3"){
                  return "Abierto-Analista";
                }else if (estado=="4"){
                  return "Abierto-Técnico";
                }else if (estado=="5"){
                  return "Cerrrado-Técnico";
                }else if (estado=="6"){
                  return "Abierto-Supervisor";
                }else if (estado=="7"){
                  return "Cerrado-Supervisor";
                }else if (estado=="8"){
                  return "Cerrado-Coordinador";
                }
              }`,
              args: [ "$status"],
              lang: "js"
            }
          } 
        }
      }
    ];
    query.push(JSON.parse(filterStr))
    console.log( query )
    let lmData = await _requestCollection.aggregate(query).get();
    console.log('lmData:', lmData);
    */

    let requests = await this.requestRepository.find(filter);
    let reports:any[]=[];
    for (let i = 0; i < requests.length; i ++){
      let user = await this.userRepository.findOne({ where : { rut : requests[i].createdBy }});
      reports.push({
        request : requests[i],
        createdByUser : user,
      });
    }
    return reports;
  }

  @get('/request/{id}', {
    responses: {
      '200': {
        description: 'Request model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Request, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Request, {exclude: 'where'}) filter?: FilterExcludingWhere<Request>
  ): Promise<Request> {
    return this.requestRepository.findById(id, filter);
  }

  @put('/request/{id}', {
    responses: {
      '204': {
        description: 'Request PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() mySurveys: Request,
  ): Promise<void> {
    var survey = await this.requestRepository.findById(id);
    survey.questions = mySurveys.questions;
    if (survey.tracks.length>0){
      survey.tracks[0].comment.assignTo = mySurveys.assigToRole
      mySurveys.tracks = survey.tracks 
    }
    await this.requestRepository.updateById(id, mySurveys);
  }

  @put('/request/track/{id}', {
    responses: {
      '204': {
        description: 'Request PUT success',
      },
    },
  })
  @authenticate('jwt')
  async trackWithId(
    @param.path.string('id') idParameter: string,
    @requestBody() request: any,
  ): Promise<void> {
    console.log(request)
    var requestEntity = await this.requestRepository.findById(idParameter);
    if (requestEntity.tracks==null){
      requestEntity.tracks=[]
    }
    requestEntity.tracks.push(request.track);
    requestEntity.status = request.status;
    requestEntity.assignedAt = request.assignedAt
    requestEntity.assigToRole = request.assigToRole
    requestEntity.updatedAt=new Date();
    await this.requestRepository.updateById(idParameter, requestEntity);
  }

  @put('/request/send/{id}', {
    responses: {
      '204': {
        description: 'Request Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async approve(
    @param.path.string('id') id: string): Promise<void> {
    const survey = await this.requestRepository.findById(id);
    survey.status = 1;
    survey.confirmatedAt = new Date();
    const user = await this.userRepository.findOne({ where : { rut : survey.rut }});
    if (user && user.status !== 3){
      const form = await this.formRepository.findOne({ where : { slug : survey.form }});
      if (form && user && user.email) {
        this.sendPollEmail(user.email, user.name + " " + user.lastName, form.title, form.slug);
      }
      await this.requestRepository
.updateById(id, survey);
    } else {
      throw new HttpErrors.Unauthorized(
        `sign-in.desactivated`,
      );
  }
  }

  private async sendPollEmail(email : string, fullname : string, form : string, slug: String){
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
        to: email, // Change to your recipient
        from: process.env.SENDGRID_SENDER_FROM, 
        subject: 'Nielsen Group - ' + form,
        html: this.emailManager.getHTMLSureyAnswered(fullname, form, slug)
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log("Successfully sent survey answered email to: " + fullname + " - " + email);
        })
        .catch((error: string) => {
          console.error(error)
        })
  }

  @get('/request/pdf/{id}', {
    responses: {
      '200': {
        description: 'Request pdf',
        content: {'application/json': {schema: {'x-ts-type': Object}}},
      },
    },
  })
  @authenticate('jwt')
  async buildPdf(@param.path.string('id') id: string): Promise<Object> {
    const mySurveys = await this.requestRepository.findById(id);
    const form = await this.findSlugOrIdForm(mySurveys.form);
    let nameFile = /*mySurveys.rut + "_" +*/ form.slug;
    const file = await createMySurveyPdf(mySurveys, form, nameFile);
    //fs.unlinkSync('./' + nameFile + '.pdf');
    //fs.unlinkSync('./' + nameFile + '.html');
    return {file: file};
  }

  private async findSlugOrIdForm(id: string): Promise<Form> {
    const form = await this.formRepository.searchSlug(id);
    if (form.length > 0) return form[0];
    return await this.formRepository.findById(id);
  }
}
