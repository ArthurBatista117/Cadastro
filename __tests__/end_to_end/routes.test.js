const request = require('supertest');
const express = require('express');
const router = require('../../src/routes');

// Mock dos módulos
jest.mock('../../src/app/controllers/controllers.js', () => ({
  index: jest.fn((req, res) => res.status(200).json({ message: 'Admin page' })),
  cadastro: jest.fn((req, res) => res.status(201).json({ message: 'Usuário cadastrado' })),
  login: jest.fn((req, res) => res.status(200).json({ token: 'fake-token' })),
  logout: jest.fn((req, res) => res.status(200).json({ message: 'Logout realizado' }))
}));

jest.mock('../../src/middlewares/validators/autentication.js', () => ({
  verifyAccess: jest.fn((req, res, next) => {
    // Simula verificação de token válido
    const token = req.headers.authorization;
    if (token === 'Bearer valid-token') {
      req.user = { id: 1, role: 'admin' };
      next();
    } else {
      res.status(401).json({ error: 'Token inválido' });
    }
  }),
  renewToken: jest.fn((req, res) => {
    if (req.body.refreshToken === 'valid-refresh-token') {
      res.status(200).json({ token: 'new-token' });
    } else {
      res.status(401).json({ error: 'Refresh token inválido' });
    }
  })
}));

jest.mock('../../src/middlewares/validators/authorization.js', () => 
  jest.fn((req, res, next) => {
    // Simula verificação de autorização
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acesso negado' });
    }
  })
);

jest.mock('../../src/middlewares/validators/controllersValidator.js', () => 
  jest.fn((req, res, next) => {
    // Simula validação básica do body
    const requiredFields = {
      '/cadastro': ['nome', 'email', 'senha'],
      '/login': ['email', 'senha'],
      '/refresh': ['refreshToken'],
      '/logout': []
    };
    
    const fields = requiredFields[req.path] || [];
    const missingFields = fields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios ausentes', 
        missing: missingFields 
      });
    }
    
    next();
  })
);

// Configuração do app de teste
const app = express();
app.use(express.json());
app.use('/', router);

describe('Testes das Rotas da API', () => {
  
  describe('GET /adm', () => {
    it('deve retornar 200 quando autenticado e autorizado', async () => {
      const response = await request(app)
        .get('/adm')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin page');
    });

    it('deve retornar 401 quando token inválido', async () => {
      const response = await request(app)
        .get('/adm')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token inválido');
    });

    it('deve retornar 401 quando sem token', async () => {
      const response = await request(app)
        .get('/adm');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /cadastro', () => {
    it('deve cadastrar usuário com dados válidos', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@email.com',
        senha: '123456'
      };

      const response = await request(app)
        .post('/cadastro')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuário cadastrado');
    });

    it('deve retornar 400 quando dados obrigatórios ausentes', async () => {
      const response = await request(app)
        .post('/cadastro')
        .send({ nome: 'João' }); // faltam email e senha
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Campos obrigatórios ausentes');
      expect(response.body.missing).toContain('email');
      expect(response.body.missing).toContain('senha');
    });
  });

  describe('POST /login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'usuario@email.com',
        senha: '123456'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBe('fake-token');
    });

    it('deve retornar 400 quando dados ausentes', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'usuario@email.com' }); // falta senha
      
      expect(response.status).toBe(400);
      expect(response.body.missing).toContain('senha');
    });
  });

  describe('POST /refresh', () => {
    it('deve renovar token com refresh token válido', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const response = await request(app)
        .post('/refresh')
        .send(refreshData);
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBe('new-token');
    });

    it('deve retornar 401 com refresh token inválido', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      const response = await request(app)
        .post('/refresh')
        .send(refreshData);
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Refresh token inválido');
    });

    it('deve retornar 400 quando refresh token ausente', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.missing).toContain('refreshToken');
    });
  });

  describe('POST /logout', () => {
    it('deve fazer logout quando autenticado', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer valid-token')
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout realizado');
    });

    it('deve retornar 401 quando não autenticado', async () => {
      const response = await request(app)
        .post('/logout')
        .send({});
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token inválido');
    });
  });

  describe('Testes de Integração dos Middlewares', () => {
    it('deve aplicar middlewares na ordem correta para /adm', async () => {
      const controllers = require('../../src/app/controllers/controllers');
      const autentication = require('../../src/middlewares/validators/autentication');
      const authorization = require('../../src/middlewares/validators/authorization');

      await request(app)
        .get('/adm')
        .set('Authorization', 'Bearer valid-token');

      expect(autentication.verifyAccess).toHaveBeenCalled();
      expect(authorization).toHaveBeenCalled();
      expect(controllers.index).toHaveBeenCalled();
    });

    it('deve aplicar validador de body antes do controller', async () => {
      const validatorBody = require('../../src/middlewares/validators/controllersValidator');
      const controllers = require('../../src/app/controllers/controllers');

      await request(app)
        .post('/cadastro')
        .send({ nome: 'Test', email: 'test@email.com', senha: '123' });

      expect(validatorBody).toHaveBeenCalled();
      expect(controllers.cadastro).toHaveBeenCalled();
    });
  });

  describe('Testes de Rotas Inexistentes', () => {
    it('deve retornar 404 para rota não encontrada', async () => {
      const response = await request(app)
        .get('/rota-inexistente');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 404 para método não permitido', async () => {
      const response = await request(app)
        .put('/login')
        .send({});
      
      expect(response.status).toBe(404);
    });
  });
});

// Configuração adicional para testes
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});