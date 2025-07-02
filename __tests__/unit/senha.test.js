const hash = require('../../src/middlewares/service/senha');

describe('Teste de criação de hash', () => {
    it('Hash deve ter formato bcrypt válido', async () => {
        const result1 = await hash.createHash('010203');
        const result2 = await hash.createHash('112233');

        // Testa o formato bcrypt
        expect(result1).toMatch(/^\$2b\$13\$.{53}$/);
        expect(result2).toMatch(/^\$2b\$13\$.{53}$/);
        
        // Testa o tamanho
        expect(result1.length).toBe(60);
        expect(result2.length).toBe(60);
    });
});

describe('Teste de verificação de hash', () =>{
    it('Teste de hash referenciando uma senha correta', async () =>{
        const result1 = await  hash.findHash('112233', '$2b$13$zDxthIo/tLa9R/OMvWhl0OdDH4Zn51BgiQldDyED.4kE7yLvZqsDi')

        expect(result1).toBeTruthy()
    })
    it('teste de hash referenciando uma senha incorreta', async () =>{
        const result1 = await hash.findHash('112233', '$2b$13$zDxthIo/tLa9R/OMvWhl0OdDH4Zn51BgiQldDyED.4kE7yLvZqsKi')

        expect(result1).not.toBeTruthy()
    })
})