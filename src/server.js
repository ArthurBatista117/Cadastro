const app = require('./app/app');

if(require.main == module){
    app.listen(3000, () =>{
        console.log('Está funcionando corretamente');
    });
}