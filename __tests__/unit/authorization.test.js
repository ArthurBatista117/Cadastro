const jwt = require('jsonwebtoken');
const authorization = require('../../src/middlewares/validators/authorization'); 

// Mock do jwt
jest.mock('jsonwebtoken');

// Mock das variáveis de ambiente
process.env.SECRET = 'test-secret';
process.env.ADMS = 'admin@test.com';

describe('Authorization Middleware', () => {
    let req, res;

    beforeEach(() => {
        // Mock do objeto req
        req = {
            headers: {},
            user: null
        };

        // Mock do objeto res
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
    });

    describe('Header de autorização ausente', () => {
        it('deve retornar 403 quando não há header de autorização', () => {
            authorization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token'
            });
        });

        it('deve retornar 403 quando header de autorização está vazio', () => {
            req.headers['authorization'] = '';

            authorization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token'
            });
        });
    });

    describe('Formato do token inválido', () => {
        it('deve retornar 403 quando não começa com "Bearer"', () => {
            req.headers['authorization'] = 'Basic token123';

            authorization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token em formato válido'
            });
        });

        it('deve retornar 403 quando não tem espaço após "Bearer"', () => {
            req.headers['authorization'] = 'Bearertoken123';

            authorization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token em formato válido'
            });
        });
    });

    describe('Verificação do JWT', () => {
        it('deve retornar 403 quando token é inválido', () => {
            req.headers['authorization'] = 'Bearer invalid-token';
            
            // Mock do jwt.verify para simular erro
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error('Token inválido'), null);
            });

            authorization(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret', expect.any(Function));
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token válido'
            });
        });

        it('deve retornar 401 quando usuário não é administrador', () => {
            req.headers['authorization'] = 'Bearer valid-token';
            
            // Mock do jwt.verify para simular sucesso com usuário não admin
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { email: 'user@test.com' });
            });

            authorization(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
            expect(req.user).toBe('user@test.com');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Apenas usuários com permissão de administradores podem acessar'
            });
        });

        it('deve passar quando token é válido e usuário é administrador', () => {
            req.headers['authorization'] = 'Bearer valid-admin-token';
            
            // Mock do jwt.verify para simular sucesso com usuário admin
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { email: 'admin@test.com' });
            });

            authorization(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('valid-admin-token', 'test-secret', expect.any(Function));
            expect(req.user).toBe('admin@test.com');
            // Não deve chamar res.status nem res.json se o usuário for admin
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('Tratamento de erros', () => {
        it('deve retornar 400 quando ocorre erro no try/catch', () => {
            // Forçar um erro no try/catch
            req.headers = null;

            // Mock do console.error para não poluir o output dos testes
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            authorization(req, res);

            expect(consoleSpy).toHaveBeenCalledWith('Houve um erro no processo de autorização ', expect.any(TypeError));
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Houve um erro no processo de autorização'
            });

            consoleSpy.mockRestore();
        });
    });

    describe('Casos de teste adicionais', () => {
        it('deve lidar com header Authorization com múltiplos espaços', () => {
            req.headers['authorization'] = 'Bearer token-with-spaces';

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { email: 'admin@test.com' });
            });

            authorization(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('token-with-spaces', 'test-secret', expect.any(Function));
        });

        it('deve verificar se o token decodificado tem a propriedade email', () => {
            req.headers['authorization'] = 'Bearer valid-token';
            
            // Mock com token sem email
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, { username: 'test' }); // sem email
            });

            authorization(req, res);

            expect(req.user).toBeUndefined();
        });

        it('deve verificar case sensitive para Bearer', () => {
            req.headers['authorization'] = 'bearer token123';

            authorization(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Adicione um token em formato válido'
            });
        });
    });
});