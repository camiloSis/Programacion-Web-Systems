const path = require('path'); // usa path para ubicar archivos en el proyecto
const express = require('express'); // importa express
const app = express(); // crea la aplicación Express

app.listen(8080, () => { // el servidor escucha en el puerto 8080
  console.log('Listening on: http://localhost:8080');
});

app.get('/', (request, response) => { // cuando alguien accede a la raíz
  response.sendFile(path.resolve(__dirname, 'index.html')); // envía el archivo index.html
});
