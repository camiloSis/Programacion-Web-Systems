const fs = require('fs')
const path = require('path') // usa path para ubicar archivos en el proyecto
const express = require('express') // importa express
const app = express() // crea la aplicación Express
app.use(express.static('pub'))

app.listen(8080, () => { // el servidor escucha en el puerto 8080
    console.log('Listening on: http://localhost:8080');
});

app.get('/', (request, response) => { // cuando alguien accede a la raíz
    response.sendFile(path.resolve(__dirname, 'index.html')) // envía el archivo index.html
});

app.get('/recitar', (request, response) => {
    fs.readFile(path.resolve(__dirname, 'priv/poema.txt'), 'utf8',
        (err, data) => {
            if (err) {
                console.error(err)
                response.status(500).json({
                    error: 'message'
                })
                return
            }
            response.json({
                text: data.replace(/\n/g, '<br>')
            })
        })
    //

})