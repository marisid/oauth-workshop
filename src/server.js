const Hapi = require('hapi');
const Inert = require('inert');
const Request = require('request');
const Querystring = require('querystring');
const Env = require('env2')('./config.env');

const server = new Hapi.Server();
const port = process.env.PORT || 3000;

server.connection({
  port: port
})

server.register(Inert, (err) => {
  if (err) throw err;
})

server.route([{
  method: 'GET',
  path: '/{file*}',
  handler: {
    directory: {
      path: 'public'
    }
  }
},{
  method: 'GET',
  path: '/login',
  handler: (req, reply) => {
    const githubLink = 'https://github.com/login/oauth/authorize';
    const queryParams = Querystring.stringify({'client_id':process.env.CLIENT_ID, 'redirect_uri':process.env.BASE_URL + '/welcome'});
    reply.redirect(`${githubLink}?${queryParams}`);
  }
}, {
  method: 'GET',
  path: '/welcome',
  handler: (req, reply) => {
    const accessTokenUrl = 'https://github.com/login/oauth/access_token';
    const code = req.query.code;
    Request({
      url: accessTokenUrl,
      method: 'POST',
      form: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code
      }
    },(err,res,body) => {
        if (err) throw err;
        reply(body);
    })
  }
}]);

server.start((err) => {
  if(err) throw err;
  console.log('Server is up and running at ', server.info.uri);
})
