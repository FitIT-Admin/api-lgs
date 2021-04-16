import {
  SchemaObject
} from '@loopback/rest';

export const UserProfileSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {type: 'string'},
    rut: {type: 'string'},
    name: {type: 'string'},
  },
};

// TODO(jannyHou): This is a workaround to manually
// describe the request body of 'Users/login'.
// We should either create a Credential model, or
// infer the spec from User model

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['rut', 'password'],
  properties: {
    rut: {
      type: 'string'
    },
    password: {
      type: 'string',
      minLength: 4,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};
