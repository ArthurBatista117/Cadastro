const { validationResult } = require('express-validator');
const { Usuario } = require('../../db/models');
const hash = require('../../middlewares/service/senha');
const jwt = require('jsonwebtoken');

class Controllers {
    async index(req, res) {
        try{
            const usuarios = await Usuario.findAll();
            //console.table(usuarios);
            return res.status(200).json(usuarios);

        } catch(error) {
            console.error('Houve um erro na rota GET / ', error);
            return res.status(500).json({error: 'Falha na conexão com o banco de dados'});
        } 
    }

    async cadastro(req, res){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({erros: errors.array()});
            }

            let { nome, email, senha } = req.body;
            senha = await hash.createHash(senha);
            const newUsuario = { nome, email, senha };
            
            //criação do novo usuário no banco de dados
            await Usuario.create(newUsuario);

            return res.status(201).json({
                message: 'Novo usuário criado',
                novoUsuario: newUsuario
            });

        }
        catch(error){
            console.error('Houve um erro na rota /cadastro ', error);
            return res.status(500)
        }
    }

    async login(req, res){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({erros: errors.array()});
            }

            const { nome, email, senha } = req.body;
            const usuario = await Usuario.findOne({where: {email: email, nome: nome}})
            //console.log(usuario['dataValues']);
            const result = hash.findHash(senha, usuario['senha']);
            if(result){
                //Usuário administrador
                if(usuario['email'] === process.env.ADMS){
                    //criação dos tokens
                    const accessToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn: '15m' });
                    const refreshToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn: '7d' });
                    
                    //Atualização no banco de dados
                    await Usuario.update({
                        refreshToken: refreshToken
                    },{
                        where: { email: usuario['email'] }
                    });

                    return res.status(200).json({
                        message: 'Usuário ADMINISTRADOR logado com sucesso!',
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    });
                }
                //Usuários normais
                else{
                    //criação dos tokens
                    const accessToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn: '15m' });
                    const refreshToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn: '7d' });
                    
                    //atualização no banco de dados
                    await Usuario.update({
                        refreshToken: refreshToken
                    },{
                        where: {email: usuario['email']}
                    });

                    return res.status(200).json({
                        message: 'Usuário logado com sucesso!',
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    });
                }
                
            }else{
                return res.status(403).json({message: 'Senha inválida'});
            }
            
        }
        catch(error){
            console.error('Houve um erro na rora /login ', error);
            return res.status(500).json({error: 'Falha na conexão com o banco de dados'});
        }
    }

    async logout(req, res){
        try{
            const oldRefreshToken = req.body.refreshToken;
            if(!oldRefreshToken){
                return res.status(404).json({
                    message: 'Forneça um token'
                });
            }
            const usuario = await Usuario.findOne({ where: { refreshToken: oldRefreshToken }})
            if(usuario){
                await Usuario.update({ refreshToken: null }, { where: { refreshToken: oldRefreshToken }});

                return res.status(200).json({
                    message: 'Usuário ' + usuario['nome'] + ' realizou logout'
                })

            } else{
                return res.status(404).json({
                    message: 'Usuário não encontrado'
                });
            }
        }
        catch(error){
            console.error('Houve um erro no logout ', error)
            return res.status(500).json({error: 'Falha na conexão com o banco de dados'});
        }
    }
}

module.exports = new Controllers();