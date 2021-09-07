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
  HttpErrors
} from '@loopback/rest';
import {Form} from '../models';
import {FormRepository, UserRepository, MySurveysRepository, RequestRepository , WorkOrderRepository, RoleRepository} from '../repositories';
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
    @repository(RequestRepository)
    public requestRepository : RequestRepository,
    @repository(WorkOrderRepository)
    public workOrderRepository : WorkOrderRepository,
    @repository(RoleRepository)
    public roleRepository : RoleRepository
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
    const forms = await this.formRepository.find(filter);
    for (let i = 0; i < forms.length; i ++){
      let user = await this.userRepository.findOne({ where : { rut : forms[i].createdBy }});
      forms[i].createdBy = user?.name + " " + user?.lastName;
    }
    return forms;
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
    if (user && user.status !== 3){
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
            let filteredForms: Form[] = [];
            for (let fr of form){
              let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug, createdBy : user.rut } });
              if (mySurveys.length === 0 || mySurveys[0].status === 0){
                filteredForms.push(fr);
              } else {
                  for (let myserv of mySurveys){
                    if (myserv.length === 0 || myserv.status === 0){
                      filteredForms.push(fr);
              }
            }
              }             
            }
            forms = forms.concat(filteredForms);
          }
          const ots = await this.workOrderRepository.find({ where: { rut_tecnico: user.rut }})
          for (let ot of ots){
            let form = await this.formRepository.find(
              { where : 
                { 
                  and: [ {ot: ot.idOT}, { status : 1} ]
                },
                order: ["vigencyAt ASC"]
              }
            )
            let filteredForms: Form[] = [];
            for (let fr of form){
              let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug, createdBy : user.rut } });
              if (mySurveys.length === 0 || mySurveys[0].status === 0){
                filteredForms.push(fr);
              } else {
              for (let myserv of mySurveys){
                  if (myserv.length === 0 || myserv.status === 0){
                    filteredForms.push(fr);
              }
            }
              }
            }
            forms = forms.concat(filteredForms);
          }
        } catch (ex){
          console.log(ex);
        }
      }
    } else {
      throw new HttpErrors.Unauthorized(
        `sign-in.desactivated`,
      );
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
    if (user && user.status !== 3){
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
              let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug, createdBy : user.rut } });
              if (mySurveys.length === 0 || mySurveys[0].status === 0){
                filteredForms.push(fr);
              } else {
                  for (let myserv of mySurveys){
                    if (myserv.length === 0 || myserv.status === 0){
                      filteredForms.push(fr);
              }
            }
              }
            }
            forms = forms.concat(filteredForms);
          }

          const ots = await this.workOrderRepository.find({ where: { rut_tecnico: user.rut }})
          for (let ot of ots){
            let form = await this.formRepository.find(
              { where : 
                { 
                  and: [ {ot: ot.idOT}, { status : 1} ]
                },
                order: ["vigencyAt ASC"],
                skip: skip,
                limit: limit
              }
            )
            let filteredForms: Form[] = [];
            for (let fr of form){
              let mySurveys = await this.mySurveysRepository.find({ where : { form : fr.slug, createdBy : user.rut } });
              if (mySurveys.length === 0 || mySurveys[0].status === 0){
                filteredForms.push(fr);
              } else {
                  for (let myserv of mySurveys){
                    if (myserv.length === 0 || myserv.status === 0){
                      filteredForms.push(fr);
              }
            }
              }
            }
            forms = forms.concat(filteredForms);
          }

        } catch (ex){
          console.log(ex);
          return forms;
        }
      }
    } else {
      throw new HttpErrors.Unauthorized(
        `sign-in.desactivated`,
      );
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
  async findSurveyHistoryCount(@param.path.string('rut') rut: string): Promise<Count> {
    const user = await this.userRepository.findOne({ where: { rut: rut}});
    if (user && user.status !== 3){
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
    } else {
      throw new HttpErrors.Unauthorized(
        `sign-in.desactivated`,
      );
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
      if (user && user.status !== 3){
      var forms: { form : Form, confirmatedDate : String}[] = [];
      if (user && user.group != null && user.group.length > 0){
        try{
            var filteredForms: any = [];
            let mySurveys = await this.mySurveysRepository.find({ where : { createdBy : user.rut,  status : 1 }, skip: skip, limit : limit});
            for (let survey of mySurveys){
              let form = await this.findSlugOrId(survey.form);
              filteredForms.push({ form : form, confirmatedDate: survey.confirmatedAt, MySurverId: survey.id});
            }          
            forms = forms.concat(filteredForms);
        } catch (ex){
          console.log(ex);
        }
      }
    } else {
      throw new HttpErrors.Unauthorized(
        `sign-in.desactivated`,
      );
    }
    return forms;
  }

// Tickets
@get('/forms/request-history/{rut}/count', {
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
async findRequestHistoryCount(@param.path.string('rut') rut: string): Promise<Count> {
  //console.log('findRequestHistoryCount')
  const user = await this.userRepository.findOne({ where: { rut: rut}});
  if (user && user.status !== 3){
    var forms: Form[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: Form[] = [];
          let mySurveys = await this.requestRepository.find(
            { 
              where : { 
                or: [ 
                  { createdBy : user.rut }, 
                  { assignedAt : user.rut },
                  { 'tracks.commentBy' : user.rut } 
                ] , 
                and:[
                  {status : {gte: 0} }
                ] ,
              }
            });
          for (let survey of mySurveys){
            let form = await this.findSlugOrId(survey.form);
            filteredForms.push(form);
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
  } else {
    throw new HttpErrors.Unauthorized(
      `sign-in.desactivated`,
    );
  }
  return { count : forms.length };
}

@get('/forms/request-history/{rut}/{skip}/{limit}', {
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
async findRequestHistoryByRut(@param.path.string('rut') rut: string, @param.path.number('skip') skip: number, @param.path.number('limit') limit: number):
   Promise<{ form : Form, confirmatedDate : String}[]> {
  //console.log('findRequestHistoryByRut')
  const user = await this.userRepository.findOne({ where: { rut: rut}});
    if (user && user.status !== 3){
    var forms: { form : Form, confirmatedDate : String}[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: any = [];
          let requests = await this.requestRepository.find(
            { 
              where : { 
                or: [ 
                  { createdBy : user.rut }, 
                  { assignedAt : user.rut},
                  { 'tracks.commentBy' : user.rut }
                ] , 
                and:[
                  {status : {gte: 0} }
                ] ,
              } , 
              skip: skip, 
              order: ['status ASC', 'createdAt DESC'],
              limit : limit
            });
          for (let request of requests){
            let form = await this.findSlugOrId(request.form);
            const userCreatedBy = await this.userRepository.findOne({ where: { rut: request.createdBy }});
            const userAssignedAt = await this.userRepository.findOne({ where: { rut: request.assignedAt }});
            const roleAssigToRole = await this.roleRepository.findOne({ where: { id: request.assigToRole }});
            filteredForms.push({ 
              form : form, 
              confirmatedDate: request.confirmatedAt, 
              RequestId: request.id,
              createdBy : userCreatedBy,
              assignedAt : userAssignedAt,
              assigToRole : roleAssigToRole,
              request : request
            });
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
  } else {
    throw new HttpErrors.Unauthorized(
      `sign-in.desactivated`,
    );
  }
  return forms;
}


@get('/forms/request-unassigned/{rut}/count', {
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
async findRequestUnassignedCount(@param.path.string('rut') rut: string): Promise<Count> {
  const user = await this.userRepository.findOne({ where: { rut: rut}});
  if (user && user.status !== 3){
    var forms: Form[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: Form[] = [];
          let requests = await this.requestRepository.find(
            { 
              where : { 
                assigToRole : user.role,  
                or : [
                  { status : 0 },
                  { status : 2 }
                ]
              }
            });
          for (let request of requests){
            let form = await this.findSlugOrId(request.form);
            filteredForms.push(form);
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
  } else {
    throw new HttpErrors.Unauthorized(
      `sign-in.desactivated`,
    );
  }
  return { count : forms.length };
}

@get('/forms/request-unassigned/{rut}/{skip}/{limit}', {
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
async findRequestUnassignedByRut(@param.path.string('rut') rut: string, @param.path.number('skip') skip: number, @param.path.number('limit') limit: number):
   Promise<{ form : Form, confirmatedDate : String}[]> {
  //console.log('findRequestHistoryByRut')
  const user = await this.userRepository.findOne({ where: { rut: rut}});
    if (user && user.status !== 3){
    var forms: { form : Form, confirmatedDate : String}[] = [];
    if (user && user.group != null && user.group.length > 0){
      try{
          var filteredForms: any = [];
          let requests = await this.requestRepository.find(
            { 
              where : { 
                assigToRole : user.role ,  
                or : [
                  { status : 0 },
                  { status : 2 }
                ]
              }, 
              skip: skip, 
              order: ['status ASC', 'createdAt DESC'],
              limit : limit
            });
          for (let request of requests){
            let form = await this.findSlugOrId(request.form);
            const userCreatedBy = await this.userRepository.findOne({ where: { rut: request.createdBy }});
            const userAssignedAt = await this.userRepository.findOne({ where: { rut: request.assignedAt }});
            const roleAssigToRole = await this.roleRepository.findOne({ where: { id: request.assigToRole }});
            filteredForms.push({ 
              form : form, 
              confirmatedDate: request.confirmatedAt, 
              RequestId: request.id,
              createdBy : userCreatedBy,
              assignedAt : userAssignedAt,
              assigToRole : roleAssigToRole,
              request : request
            });
          }          
          forms = forms.concat(filteredForms);
      } catch (ex){
        console.log(ex);
      }
    }
  } else {
    throw new HttpErrors.Unauthorized(
      `sign-in.desactivated`,
    );
  }
  return forms;
}
// Cesar Ogalde

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
    formTemp.tipo_form = form.tipo_form;
    formTemp.group = form.group;
    formTemp.ot = form.ot;
    formTemp.requireGeo = form.requireGeo;
    formTemp.questions = form.questions;
    await this.formRepository.updateById(formTemp.id, formTemp);
    const formNew = await this.formRepository.findById(formTemp.id);
    let surveys = await this.mySurveysRepository.find({ where : { form : slug}});
    for (let survey of surveys){
      survey.form = formNew.slug;
      await this.mySurveysRepository.update(survey);
    }
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
    @param.path.string('slug') slug: string,  @requestBody() questions: {title: string, alternatives: string[], tipo: string, condicional: string[], validations: string[]}[],
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
