/**
 * Test Helpers
 * Utility functions for testing
 */

import request from 'supertest';

// We need to import the app, but it will be created dynamically in tests
// to avoid circular dependencies during test setup

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const createTestUser = async (
  app: any,
  userData: TestUser,
  inviteToken: string
): Promise<{ id: string; email: string }> => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      ...userData,
      invitationCode: inviteToken,
    });

  if (!response.body.success) {
    throw new Error(`Failed to create test user: ${response.body.error?.message}`);
  }

  return response.body.data.user;
};

export const loginTestUser = async (
  app: any,
  email: string,
  password: string
): Promise<string> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (!response.body.success) {
    throw new Error(`Login failed: ${response.body.error?.message}`);
  }

  return response.body.data.token;
};

export const expectSuccessResponse = (response: any, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
};

export const expectErrorResponse = (
  response: any,
  expectedStatus: number,
  expectedCode?: string
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('code');
  expect(response.body.error).toHaveProperty('message');
  
  if (expectedCode) {
    expect(response.body.error.code).toBe(expectedCode);
  }
};

export const expectPaginatedResponse = (response: any) => {
  expectSuccessResponse(response);
  expect(response.body.data).toBeInstanceOf(Array);
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('totalPages');
};

// Generate unique test data
let counter = 0;
export const uniqueEmail = (prefix = 'test') => {
  counter++;
  return `${prefix}.${Date.now()}.${counter}@test.muslimeen.org`;
};

export const uniqueInviteToken = () => {
  return `TEST${Date.now()}${counter}`.substring(0, 12).toUpperCase();
};
