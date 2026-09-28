const http = require('http'); // importa el módulo http de Node.js para crear un servidor

const server = http.createServer((request, response) => { // crea un servidor HTTP que recibe peticiones y responde
  console.log(request.url); // imprime en la consola la URL que solicitó el cliente
  response.end('Hola mundo'); // responde al navegador con el texto "Hola mundo"
});

server.listen(3001, () => { // el servidor escucha en el puerto 3000
  console.log('Listening on http://localhost:3001'); // muestra la dirección local para acceder al servidor
});

// Retroalimentación: muy bien por empezar con el concepto de servidor HTTP.
// Tu idea es correcta; solo faltaba la sintaxis del callback de createServer.
// La palabra clave es que "request" y "response" solo existen dentro de la función del servidor.
// También es recomendable mantener los comentarios en español y usar nombres claros como request y response.
