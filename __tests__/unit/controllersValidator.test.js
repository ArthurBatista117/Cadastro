const request = require('supertest');
const express = require('express');
const { validationResult } = require('express-validator');
const validatorBody = require('../../src/middlewares/validators/controllersValidator');

// Configuração do app de teste
const app = express();
app.use(express.json());

// Rota de teste que usa o validatorBody
app.post('/test', validatorBody, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.status(200).json({ message: 'Dados válidos' });
});

describe('Testes para validatorBody', () => {
  
  describe('Campo nome', () => {
    it('deve retornar erro quando nome está vazio', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: '',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'nome',
          msg: 'Campo requerido'
        })
      );
    });

    it('deve retornar erro quando nome tem menos de 2 caracteres', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'A',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'nome',
          msg: 'Digite um nome com pelo menos duas letras'
        })
      );
    });

    it('deve retornar erro quando nome contém números ou caracteres especiais', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João123',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'nome',
          msg: 'Por favor digite um nome válido'
        })
      );
    });

    it('deve aceitar nome válido com espaços', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João Silva',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(200);
    });

    it('deve aceitar nome com acentos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'José da Silva',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Campo email', () => {
    it('deve retornar erro quando email está vazio', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: '',
          senha: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'email',
          msg: 'Campo requerido'
        })
      );
    });

    it('deve retornar erro quando email é inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'email-invalido',
          senha: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'email',
          msg: 'Digite um email válido'
        })
      );
    });

    it('deve aceitar email válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'joao@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Campo senha', () => {
    it('deve retornar erro quando senha está vazia', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'teste@email.com',
          senha: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'senha',
          msg: 'Campo requerido'
        })
      );
    });

    it('deve retornar erro quando senha tem menos de 6 caracteres', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'teste@email.com',
          senha: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'senha',
          msg: 'Sua senha deve ter entre 6 e 8 caracteres'
        })
      );
    });

    it('deve retornar erro quando senha tem mais de 8 caracteres', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'teste@email.com',
          senha: '123456789'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          path: 'senha',
          msg: 'Sua senha deve ter entre 6 e 8 caracteres'
        })
      );
    });

    it('deve aceitar senha com 6 caracteres', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'teste@email.com',
          senha: '123456'
        });

      expect(response.status).toBe(200);
    });

    it('deve aceitar senha com 8 caracteres', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'João',
          email: 'teste@email.com',
          senha: '12345678'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Múltiplos erros', () => {
    it('deve retornar múltiplos erros quando vários campos são inválidos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: '',
          email: 'email-invalido',
          senha: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveLength(5); // 3 erros do nome + 1 do email + 1 da senha
      
      // Verifica se os erros específicos estão presentes
      const errorMessages = response.body.errors.map(error => error.msg);
      expect(errorMessages).toContain('Campo requerido'); // nome vazio
      expect(errorMessages).toContain('Digite um nome com pelo menos duas letras'); // nome muito curto
      expect(errorMessages).toContain('Por favor digite um nome válido'); // nome inválido
      expect(errorMessages).toContain('Digite um email válido'); // email inválido
      expect(errorMessages).toContain('Sua senha deve ter entre 6 e 8 caracteres'); // senha muito curta
      
      // Verifica que todos os campos têm erros
      const errorPaths = response.body.errors.map(error => error.path);
      expect(errorPaths).toContain('nome');
      expect(errorPaths).toContain('email');
      expect(errorPaths).toContain('senha');
    });
  });

  describe('Campos ausentes', () => {
    it('deve retornar erro quando todos os campos estão ausentes', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveLength(7); // 3 erros do nome + 2 do email + 2 da senha
      
      // Verifica que todos os campos têm pelo menos um erro
      const errorPaths = response.body.errors.map(error => error.path);
      expect(errorPaths).toContain('nome');
      expect(errorPaths).toContain('email');
      expect(errorPaths).toContain('senha');
      
      // Verifica que o erro "Campo requerido" aparece para todos os campos
      const requiredErrors = response.body.errors.filter(error => error.msg === 'Campo requerido');
      expect(requiredErrors).toHaveLength(3); // Um para cada campo
      expect(requiredErrors.map(e => e.path)).toEqual(expect.arrayContaining(['nome', 'email', 'senha']));
    });
  });

  describe('Dados completamente válidos', () => {
    it('deve aceitar todos os dados quando estão válidos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nome: 'Maria da Silva',
          email: 'maria@email.com',
          senha: 'senha123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Dados válidos');
    });
  });
});