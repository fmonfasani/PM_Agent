const request = require('supertest');
const { expect } = require('chai');
const app = require('./server');

describe('Online Store API Tests', () => {
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('price');
      expect(res.body[0]).to.have.property('stock');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const res = await request(app)
        .get('/api/products/1')
        .expect(200);
      
      expect(res.body).to.be.an('object');
      expect(res.body.id).to.equal(1);
      expect(res.body.name).to.equal('Laptop');
    });

    it('should return 404 if product not found', async () => {
      await request(app)
        .get('/api/products/999')
        .expect(404);
    });
  });
});