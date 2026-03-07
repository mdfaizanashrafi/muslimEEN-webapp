/**
 * Marketplace API Integration Tests
 * Tests marketplace endpoints with real database
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import { app, testPool } from './setup';

describe('Marketplace API Integration', () => {
  // Test users
  const providerUser = {
    email: 'provider@example.com',
    password: 'Password123!',
    firstName: 'Provider',
    lastName: 'User',
  };

  const regularUser = {
    email: 'regular@example.com',
    password: 'Password123!',
    firstName: 'Regular',
    lastName: 'User',
  };

  let providerToken: string;
  let regularToken: string;
  let providerId: string;
  let regularId: string;

  // Setup: Create test users
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(providerUser.password, 4);

    // Create provider user
    const providerResult = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'business_provider', 700)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [providerUser.email, hashedPassword, providerUser.firstName, providerUser.lastName]);
    providerId = providerResult.rows[0].id;

    // Create regular user
    const regularResult = await testPool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, trust_score)
      VALUES ($1, $2, $3, $4, 'muslim_verified', 500)
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING id;
    `, [regularUser.email, hashedPassword, regularUser.firstName, regularUser.lastName]);
    regularId = regularResult.rows[0].id;

    // Login both users
    const providerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: providerUser.email, password: providerUser.password });
    providerToken = providerLogin.body.token;

    const regularLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: regularUser.email, password: regularUser.password });
    regularToken = regularLogin.body.token;
  });

  // Seed marketplace items before each test
  beforeEach(async () => {
    // Insert test marketplace items
    const verticals = ['earn', 'build', 'live', 'protect'];
    
    for (const vertical of verticals) {
      await testPool.query(`
        INSERT INTO marketplace_items (vertical, category, title, description, provider_id)
        VALUES ($1, 'Test Category', $2, 'Test description for ' || $2, $3)
        ON CONFLICT DO NOTHING;
      `, [vertical, `Test ${vertical} item`, providerId]);
    }
  });

  describe('GET /api/marketplace/:vertical', () => {
    it('should return marketplace items for earn vertical', async () => {
      const response = await request(app)
        .get('/api/marketplace/earn')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return marketplace items for all verticals', async () => {
      const verticals = ['earn', 'build', 'live', 'protect'];
      
      for (const vertical of verticals) {
        const response = await request(app)
          .get(`/api/marketplace/${vertical}`)
          .set('Authorization', `Bearer ${regularToken}`)
          .expect('Content-Type', /json/);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/marketplace/earn')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/marketplace/earn?category=Test%20Category')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/marketplace/:vertical/:id', () => {
    it('should return specific marketplace item', async () => {
      // Get first item
      const itemsResult = await testPool.query(`
        SELECT id FROM marketplace_items WHERE vertical = 'earn' LIMIT 1;
      `);
      
      if (itemsResult.rows.length === 0) {
        console.log('Skipping test - no items available');
        return;
      }

      const itemId = itemsResult.rows[0].id;

      const response = await request(app)
        .get(`/api/marketplace/earn/${itemId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.item).toBeDefined();
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/marketplace/earn/${fakeId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/marketplace/:vertical', () => {
    it('should create new marketplace item', async () => {
      const newItem = {
        title: 'New Test Job',
        description: 'A test job posting',
        category: 'Employment',
        location: 'Remote',
      };

      const response = await request(app)
        .post('/api/marketplace/earn')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(newItem)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.item).toBeDefined();
      expect(response.body.item.title).toBe(newItem.title);
    });

    it('should reject item without required fields', async () => {
      const response = await request(app)
        .post('/api/marketplace/earn')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({}) // Empty body
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/marketplace/earn')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/marketplace/:vertical/:id', () => {
    it('should update marketplace item', async () => {
      // Get item owned by provider
      const itemsResult = await testPool.query(`
        SELECT id FROM marketplace_items WHERE provider_id = $1 LIMIT 1;
      `, [providerId]);
      
      if (itemsResult.rows.length === 0) {
        console.log('Skipping test - no provider items available');
        return;
      }

      const itemId = itemsResult.rows[0].id;
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/marketplace/earn/${itemId}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(updateData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent updating item owned by another user', async () => {
      // Get item owned by provider
      const itemsResult = await testPool.query(`
        SELECT id FROM marketplace_items WHERE provider_id = $1 LIMIT 1;
      `, [providerId]);
      
      if (itemsResult.rows.length === 0) {
        console.log('Skipping test - no provider items available');
        return;
      }

      const itemId = itemsResult.rows[0].id;

      // Try to update with regular user's token
      const response = await request(app)
        .put(`/api/marketplace/earn/${itemId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ title: 'Hacked Title' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/marketplace/:vertical/:id', () => {
    it('should delete marketplace item', async () => {
      // Create a new item to delete
      const createResponse = await request(app)
        .post('/api/marketplace/earn')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Item to Delete',
          description: 'Will be deleted',
          category: 'Test',
        });

      const itemId = createResponse.body.item?.id;
      
      if (!itemId) {
        console.log('Skipping test - item creation failed');
        return;
      }

      const response = await request(app)
        .delete(`/api/marketplace/earn/${itemId}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent deleting item owned by another user', async () => {
      // Get item owned by provider
      const itemsResult = await testPool.query(`
        SELECT id FROM marketplace_items WHERE provider_id = $1 LIMIT 1;
      `, [providerId]);
      
      if (itemsResult.rows.length === 0) {
        console.log('Skipping test - no provider items available');
        return;
      }

      const itemId = itemsResult.rows[0].id;

      const response = await request(app)
        .delete(`/api/marketplace/earn/${itemId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/marketplace/:vertical/:id/invest', () => {
    it('should record investment in marketplace item', async () => {
      // Get an item
      const itemsResult = await testPool.query(`
        SELECT id FROM marketplace_items WHERE vertical = 'build' LIMIT 1;
      `);
      
      if (itemsResult.rows.length === 0) {
        console.log('Skipping test - no items available');
        return;
      }

      const itemId = itemsResult.rows[0].id;

      const response = await request(app)
        .post(`/api/marketplace/build/${itemId}/invest`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ amount: 1000 })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
