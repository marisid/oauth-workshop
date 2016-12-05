const Hapi = require('hapi');
const Inert = require('inert');

const server = new Hapi.Server();
const port = process.env.PORT || 3000;

server.connection({
  port: port
})

server.register(Inert, (err) => {
  if (err) throw err;
  server.route({
    method: 'GET',
    path: '/{file*}',
    handler: {
      directory: {
        path: 'public'        
      }
    }
  })
})

server.start((err) => {
  if(err) throw err;
  console.log('Server is up and running at ', server.info.uri);
})
