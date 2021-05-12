import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {Form} from '../models';
import {FormRepository, UserRepository, MySurveysRepository} from '../repositories';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';

export class VigencyDate {
  vigencyAt: Date;
}
export class FormController {
  constructor(
    @repository(FormRepository)
    public formRepository : FormRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @repository(MySurveysRepository)
    public mySurveysRepository : MySurveysRepository,
  ) {}

  @post('/forms', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {'application/json': {schema: getModelSchemaRef(Form)}},
      },
    },
  })
  @authenticate('jwt')
  async create(@inject(SecurityBindings.USER)
  currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Form, {
            title: 'NewForm',
            exclude: ['id'],
          }),
        },
      },
    })
    form: Omit<Form, 'id'>,
  ): Promise<Form> {
    const rut = currentUserProfile[securityId];
    form.createdBy = rut;
    form.status = 0;
    return this.formRepository.create(form);
  }

  @get('/forms/count', {
    responses: {
      '200': {
        description: 'Form model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async count(
    @param.where(Form) where?: Where<Form>,
  ): Promise<Count> {
    return this.formRepository.count(where);
  }

  @get('/forms', {
    responses: {
      '200': {
        description: 'Array of Form model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Form, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @param.filter(Form) filter?: Filter<Form>,
  ): Promise<Form[]> {
    return this.formRepository.find(filter);
  }

  @get('/forms/{slug}', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findById(
    @param.path.string('slug') slug: string ): Promise<Form> {
      var form = await this.findSlugOrId(slug);
      const user = await this.userRepository.find({ where : { rut : form.createdBy}});
      form.createdBy = user[0].name + " " + user[0].lastName  + " " + user[0].secondLastName
    return form;
  }

  @get('/forms/my/{rut}/count', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findByRutCount(@param.path.string('rut') rut: string): Promise<Count> {
    const user = await this.userRepository.findOne({ where: { rut: rut}});
    var forms: Form[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
        for (let group of user.group){
          let form = await this.formRepository.find(
            { where : 
              { 
                and: [ {group: group}, { status : 1} ]
              },
              order: ["vigencyAt ASC"]
            }
          )
          //let mySurvey = await this.mySurveysRepository.find({ where : { form : form.slug } })
          let filteredForms: Form[] = [];
          for (let fr of form){
            let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug } });
            if (mySurveys.length === 0 || mySurveys[0].status === 0){
              filteredForms.push(fr);
            }
          }
          forms = forms.concat(filteredForms);
        }

      } catch (ex){
        console.log(ex);
      }
    }
    return { count : forms.length};
  }

  @get('/forms/my/{rut}/{skip}/{limit}', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findByRut(@param.path.string('rut') rut: string, @param.path.number('skip') skip: number, @param.path.number('limit') limit: number ): Promise<Form[]> {
    const user = await this.userRepository.findOne({ where: { rut: rut}});
    var forms: Form[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
        for (let group of user.group){
          let form = await this.formRepository.find(
            { where : 
              { 
                and: [ {group: group}, { status : 1} ]
              },
              order: ["vigencyAt ASC"],
              skip: skip,
              limit: limit
            }
          )
          let filteredForms: Form[] = [];
          for (let fr of form){
            let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug } });
            if (mySurveys.length === 0 || mySurveys[0].status === 0){
              filteredForms.push(fr);
            }
          }
          forms = forms.concat(filteredForms);
        }

      } catch (ex){
        console.log(ex);
        return forms;
      }
    }
    return forms;
  }

  @get('/forms/my-history/{rut}/count', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findSurveyHistoryCountt(@param.path.string('rut') rut: string): Promise<Count> {
    const user = await this.userRepository.findOne({ where: { rut: rut}});
    var forms: Form[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: Form[] = [];
          let mySurveys = await this.mySurveysRepository.find({ where : { createdBy : user.rut,  status : 1 }});
          for (let survey of mySurveys){
            let form = await this.findSlugOrId(survey.form);
            filteredForms.push(form);
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
    return { count : forms.length };
  }

  @get('/forms/my-history/{rut}/{skip}/{limit}', {
    responses: {
      '200': {
        description: 'Form model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Form, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async findSurveyHistoryByRut(@param.path.string('rut') rut: string, @param.path.number('skip') skip: number, @param.path.number('limit') limit: number):
     Promise<{ form : Form, confirmatedDate : String}[]> {
    
    const user = await this.userRepository.findOne({ where: { rut: rut}});
    var forms: { form : Form, confirmatedDate : String}[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: any = [];
          let mySurveys = await this.mySurveysRepository.find({ where : { createdBy : user.rut,  status : 1 }, skip: skip, limit : limit});
          for (let survey of mySurveys){
            let form = await this.findSlugOrId(survey.form);
            filteredForms.push({ form : form, confirmatedDate: survey.confirmatedAt});
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
    return forms;
  }

  @put('/forms/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('slug') slug: string,
    @requestBody() form: Form,
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.title = form.title;
    formTemp.description = form.description;
    formTemp.customer = form.customer;
    formTemp.group = form.group;
    formTemp.ot = form.ot;
    formTemp.questions = form.questions;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }

  @put('/forms/questions/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async questions(
    @param.path.string('slug') slug: string,  @requestBody() questions: {title: string; alternatives: string[]}[],
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.questions =questions;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }


  @put('/forms/approve/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async approve(
    @param.path.string('slug') slug: string,
    @requestBody() form: VigencyDate,
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.publishAt = new Date();
    formTemp.vigencyAt = form.vigencyAt;
    formTemp.status = 1;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }

  @put('/forms/suspend/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async suspend(
    @param.path.string('slug') slug: string
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.suspendAt = new Date();
    formTemp.status = 2;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }

  @put('/forms/delete/{slug}', {
    responses: {
      '204': {
        description: 'Form PUT success',
      },
    },
  })
  @authenticate('jwt')
  async delete(
    @param.path.string('slug') slug: string
  ): Promise<void> {
    const formTemp = await this.findSlugOrId(slug);
    formTemp.deleteAt = new Date();
    formTemp.status = 3;
    await this.formRepository.updateById(formTemp.id, formTemp);
  }

  @del('/forms/{slug}', {
    responses: {
      '204': {
        description: 'Form DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('slug') slug: string): Promise<void> {
    const form = await this.findSlugOrId(slug);
    await this.formRepository.deleteById(form.id);
  }

  private async findSlugOrId(id: string): Promise<Form> {
    const form = await this.formRepository.searchSlug(id);
    if (form.length > 0) return form[0];
    return await this.formRepository.findById(id);
  }
}
