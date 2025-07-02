// Mock do dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Mock do JWT
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn()
}));

// Mock dos models 
jest.mock('../../src/db/models', () => ({
    Usuario: {
        findOne: jest.fn(),
        update: jest.fn()
    }
}));

const jwt = require('jsonwebtoken');
const { Usuario } = require('../../src/db/models');
const autentication = require('../../src/middlewares/validators/autentication');

// Mock do process.env
process.env.SECRET = 'test-secret';

describe('Autenticação JWT', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockReq = {
            headers: {},
            body: {}
        };
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockNext = jest.fn();
    });

    describe('verifyAccess', () => {
        it('deve retornar erro 401 quando não há header authorization', () => {
            autentication.verifyAccess(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Adicione um token'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('deve retornar erro 401 quando o formato do token é inválido', () => {
            mockReq.headers['authorization'] = 'InvalidFormat token123';
            
            autentication.verifyAccess(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Adicione um token em formato válido'
            });
        });

        it('deve chamar next() quando o token é válido', () => {
            mockReq.headers['authorization'] = 'Bearer valid-token';
            
            // Mock do jwt.verify para simular sucesso
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { accessToken: 'decoded-token' });
            });
            
            autentication.verifyAccess(mockReq, mockRes, mockNext);
            
            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
            expect(mockReq.accessToken).toBe('decoded-token');
            expect(mockNext).toHaveBeenCalled();
        });

        it('deve retornar erro 401 quando o token é inválido', () => {
            mockReq.headers['authorization'] = 'Bearer invalid-token';
            
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Token inválido'), null);
            });
            
            autentication.verifyAccess(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Adicione um token válido',
                errors: 'Token inválido'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('renewToken', () => {
        it('deve retornar erro 403 quando não há refreshToken', async () => {
            await autentication.renewToken(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Forneça um token para a renovação'
            });
        });

        it('deve renovar tokens com sucesso quando refreshToken é válido', async () => {
             mockReq.body.refreshToken = 'valid-refresh-token';
            
            const mockUser = {
                email: 'test@example.com',
                refreshToken: 'valid-refresh-token'
            };
            
            // Mock do jwt.verify para simular sucesso - executa callback imediatamente
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { email: 'test@example.com' });
                return true; // Retorna algo para indicar sucesso
            });
            
            // Mock do Usuario.findOne
            Usuario.findOne.mockResolvedValue(mockUser);
            
            // Mock do jwt.sign para gerar novos tokens
            jwt.sign
                .mockReturnValueOnce('new-access-token')  // primeiro chamada (accessToken)
                .mockReturnValueOnce('new-refresh-token'); // segunda chamada (refreshToken)
            
            // Mock do Usuario.update
            Usuario.update.mockResolvedValue([1]);
            
            // Executa o método e aguarda um tempo para callbacks assíncronos
            const promise = autentication.renewToken(mockReq, mockRes, mockNext);
            
            // Aguarda um pouco para callbacks assíncronos
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verificações
            expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-secret', expect.any(Function));
            
            expect(Usuario.findOne).toHaveBeenCalledWith({
                where: { refreshToken: 'valid-refresh-token' }
            });
            
            expect(Usuario.update).toHaveBeenCalledWith(
                { refreshToken: 'new-refresh-token' },
                { where: { email: 'test@example.com' } }
            );
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Tokens renovados com sucesso',
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token'
            });
        });

        it('deve retornar erro 403 quando refreshToken não está ligado a nenhum usuário', async () => {
            mockReq.body.refreshToken = 'invalid-refresh-token';
            
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { email: 'test@example.com' });
            });
            
            Usuario.findOne.mockResolvedValue(null);
            
            await autentication.renewToken(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Esse token não está ligado a nenhum usuário'
            });
        });

        it('deve retornar erro 403 quando refreshToken é inválido', async () => {
            mockReq.body.refreshToken = 'expired-token';
            
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Token expirado'), null);
            });
            
            await autentication.renewToken(mockReq, mockRes, mockNext);
            
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                errors: 'Token expirado'
            });
        });
    });
});