require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../db/models');
const { where } = require('sequelize');

const autentication = {
    verifyAccess: (req, res, next) =>{
        try{
            const authHeaders = req.headers['authorization'];
            if(!authHeaders){
                return res.status(401).json({
                    message: 'Adicione um token'
                });
            }

            const parts = authHeaders.split(' ');
            if(parts[0] !== 'Bearer'){
                return res.status(401).json({
                    message: 'Adicione um token em formato válido'
                })
            }

            const token = parts[1];

            jwt.verify(token, process.env.SECRET, (err, decode) =>{
                if(err){
                    return res.status(401).json({
                        message: 'Adicione um token válido',
                        errors: err.message
                    });
                }

                req.accessToken = decode.accessToken;

                next()
            });
        } catch(error){
            console.error('Houve um erro na verificação dos tokens ', error);
            return res.status(403).json({
                message: 'Houve um erro na verificação dos tokens'
            })
        }
    },

    renewToken: (req, res, next) =>{
        try{
            const oldRefreshToken = req.body.refreshToken;
            if(!oldRefreshToken){
                return res.status(403).json({
                    message: 'Forneça um token para a renovação'
                })
            }
            jwt.verify(oldRefreshToken, process.env.SECRET, async (err, decode) =>{
                if(err){
                    return res.status(403).json({
                        errors: err.message
                    });
                }

                const usuario = await Usuario.findOne({ where: {
                    refreshToken: oldRefreshToken }});
                //console.log(usuario);
                if(usuario){
                    //renovação dos tokens
                    const email = usuario['email'];
                    const accessToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn:    '15m' });
                    const refreshToken = jwt.sign(
                        { email }, process.env.SECRET, { expiresIn: '7d' });
                    await Usuario.update({
                            refreshToken: refreshToken
                        },{
                            where: { email: email }
                        });
                        
                    return res.status(200).json({
                        message: 'Tokens renovados com sucesso',
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    })
                } else{
                    console.log('Esse token não está ligado a nenhum usuário');
                    return res.status(403).json({
                        message: 'Esse token não está ligado a nenhum usuário'
                    })
                }
            });

        } catch(error){
            console.error('Houve um erro na renovação dos tokens ', error);
            return res.status(403).json({
                message: 'Houve um erro na renovação dos tokens'
            })
        }      
    }
}
module.exports = autentication;