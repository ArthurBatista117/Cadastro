const express = require('express');
const router = express.Router();
const controllers = require('./app/controllers/controllers')
const autentication = require('./middlewares/validators/autentication');
const authorization = require('./middlewares/validators/authorization');
const validarorBody = require('./middlewares/validators/controllersValidator');

router.get('/adm', autentication.verifyAccess, authorization, controllers.index)
router.post('/cadastro', validarorBody, controllers.cadastro);
router.post('/login', validarorBody, controllers.login);
router.post('/refresh', validarorBody, autentication.renewToken);
router.post('/logout', validarorBody, autentication.verifyAccess, controllers.logout);


module.exports = router;