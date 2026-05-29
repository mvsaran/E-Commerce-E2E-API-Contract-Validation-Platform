/**
 * schemas/LoginSchema.ts
 * 
 * AJV JSON Schema for POST /api/auth/login response.
 * Validates that a valid token and user object are returned.
 */

import { JSONSchemaType } from 'ajv';

export interface LoginResponse {
  token: string;
  user: {
    id:    string;
    email: string;
    name:  string;
    role:  string;
  };
}

export const LoginSchema: JSONSchemaType<LoginResponse> = {
  type: 'object',
  required: ['token', 'user'],
  additionalProperties: true,
  properties: {
    token: {
      type: 'string',
      minLength: 10,
      description: 'JWT authentication token',
    },
    user: {
      type: 'object',
      required: ['id', 'email', 'name', 'role'],
      additionalProperties: true,
      properties: {
        id: {
          type: 'string',
          minLength: 1,
        },
        email: {
          type: 'string',
          format: 'email',
        },
        name: {
          type: 'string',
          minLength: 1,
        },
        role: {
          type: 'string',
          enum: ['admin', 'user', 'guest'],
        },
      },
    },
  },
};
