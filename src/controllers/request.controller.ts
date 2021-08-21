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
    request.createdBy = rut;
    request.status = 0;
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
  ): Promise<Request[]> {
    return this.requestRepository.find(filter);
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
    await this.requestRepository.updateById(id, mySurveys);
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
