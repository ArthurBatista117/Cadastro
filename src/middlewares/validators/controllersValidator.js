const { body } = require('express-validator');

const validatorBody = [

    body('nome').notEmpty().withMessage('Campo requerido')
                .isLength({min: 2}).withMessage('Digite um nome com pelo menos duas letras')
                .isAlpha('pt-BR', { ignore: ' ' }).withMessage('Por favor digite um nome válido')
    ,

    
    body('email').notEmpty().withMessage('Campo requerido')
                    .isEmail().withMessage('Digite um email válido')
    ,

    body('senha').notEmpty().withMessage('Campo requerido')
                    .isLength({min: 6, max: 8}).withMessage('Sua senha deve ter entre 6 e 8 caracteres')
];

module.exports = validatorBody;