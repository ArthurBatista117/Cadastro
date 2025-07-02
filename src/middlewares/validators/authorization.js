const jwt = require('jsonwebtoken');
require('dotenv').config();

const authorization = (req, res) =>{
    try{
         const authHeaders = req.headers['authorization'];
            if(!authHeaders){
                return res.status(403).json({
                    message: 'Adicione um token'
                });
            }

            const parts = authHeaders.split(' ');
            if(parts[0] !== 'Bearer'){
                return res.status(403).json({
                    message: 'Adicione um token em formato válido'
                })
            }

            const accessToken = parts[1];
        jwt.verify(accessToken, process.env.SECRET, (err, decode) =>{
                if(err){
                    return res.status(403).json({
                        message: 'Adicione um token válido'
                    });
                }

                req.user = decode.email;
                //console.log('Token decoded:', decode);

                if(req.user !== process.env.ADMS){
                    res.status(401).json({
                        message: 'Apenas usuários com permissão de administradores podem acessar'
                    });
                }    
        })
    } catch(error){
        console.error('Houve um erro no processo de autorização ', error);
        return res.status(400).json({
            message: 'Houve um erro no processo de autorização'
        });
    }
}

module.exports = authorization;