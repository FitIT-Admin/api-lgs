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
import {MySurveys} from '../models';
import {MySurveysRepository, UserRepository, FormRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {EmailManager} from '../services/email.service';
import {
  EmailManagerBindings
} from '../keys';
const sgMail = require('@sendgrid/mail')

export class MySurveysController {
  constructor(
    @repository(MySurveysRepository)
    public mySurveysRepository : MySurveysRepository,
    @repository(FormRepository)
    public formRepository : FormRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @inject(EmailManagerBindings.SEND_MAIL) public emailManager: EmailManager
  ) {}

  @post('/my-surveys', {
    responses: {
      '200': {
        description: 'MySurveys model instance',
        content: {'application/json': {schema: getModelSchemaRef(MySurveys)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MySurveys, {
            title: 'NewMySurveys',
            exclude: [''],
          }),
        },
      },
    })
    mySurveys: Omit<MySurveys, ''>,
  ): Promise<MySurveys> {
    const rut = currentUserProfile[securityId];
    mySurveys.createdBy = rut;
    mySurveys.status = 0;
    return this.mySurveysRepository.create(mySurveys);
  }
  @authenticate('jwt')
  @get('/my-surveys/count', {
    responses: {
      '200': {
        description: 'MySurveys model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(MySurveys) where?: Where<MySurveys>,
  ): Promise<Count> {
    return this.mySurveysRepository.count(where);
  }

  @get('/my-surveys', {
    responses: {
      '200': {
        description: 'Array of MySurveys model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MySurveys, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(MySurveys) filter?: Filter<MySurveys>,
  ): Promise<MySurveys[]> {
    return this.mySurveysRepository.find(filter);
  }

  @get('/my-surveys/{id}', {
    responses: {
      '200': {
        description: 'MySurveys model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MySurveys, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(MySurveys, {exclude: 'where'}) filter?: FilterExcludingWhere<MySurveys>
  ): Promise<MySurveys> {
    return this.mySurveysRepository.findById(id, filter);
  }

  @put('/my-surveys/{id}', {
    responses: {
      '204': {
        description: 'MySurveys PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() mySurveys: MySurveys,
  ): Promise<void> {
    var survey = await this.mySurveysRepository.findById(id);
    survey.questions = mySurveys.questions;
    await this.mySurveysRepository.updateById(id, mySurveys);
  }

  @put('/my-surveys/send/{id}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async approve(
    @param.path.string('id') id: string): Promise<void> {
    const survey = await this.mySurveysRepository.findById(id);
    survey.status = 1;
    survey.confirmationDate = new Date();
    const user = await this.userRepository.findOne({ where : { rut : survey.rut }});
    const form = await this.formRepository.findOne({ where : { slug : survey.form }});
    if (form && user && user.email){
      this.sendPollEmail(user.email, user.name + " " + user.lastName, form.title, form.slug);
    }
    await this.mySurveysRepository.updateById(id, survey);
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
}
