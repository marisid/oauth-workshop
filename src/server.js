const Hapi = require('hapi');
const Inert = require('inert');
const Request = require('request');
const Querystring = require('querystring');
const Env = require('env2')('./config.env');
const cookieAuth = require('hapi-auth-cookie');

const server = new Hapi.Server();
const port = process.env.PORT || 3000;

// separate function so that it's easier to test functionality later
const getUserDetails = (accessToken, cb) => {
  Request.get({
    url: 'https://api.github.com/user',
    headers: {
      // Required header keys can be found in the API documentation
      // Name of the application
      'User-Agent': 'OAuth workshop',
      // Common signature that is used for web tokens
      Authorization: `token ${accessToken}`
    }
  }, cb);
}

server.connection({
  port: port
});

const options = {
  password: process.env.ENCRYPTION_CODE,
  cookie: 'activeUserCookie',
  isSecure: false,
  ttl: 24 * 60 * 60 * 1000
};

server.register([cookieAuth, Inert], (err) => {
  if (err) {throw err};
  server.auth.strategy('session', 'cookie', options);
  // when registering the cookie auth plugin, routes should be inside the callback
  // inert plugin is activated immediately though
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
  },{
    method: 'GET',
    path: '/welcome',
    config: {
      handler: (req, reply) => {
        const accessTokenUrl = 'https://github.com/login/oauth/access_token';
        Request({
          headers: {
            accept: 'application/json',
          },
          url: accessTokenUrl,
          method: 'POST',
          form: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: req.query.code
          }
        },(err,res,body) => {
            if (err) throw err;
            const json = JSON.parse(body)
            console.log(json.access_token);
            const userDetails = {
              access_token: json.access_token
            };
            req.cookieAuth.set(userDetails);
            reply.redirect('/profile');
        })
      }
    }
  }, {
      method: 'GET',
      path: '/profile',
      config: {
        auth: {
          mode: 'try', // try to go to page even if the strategy is not loaded
          strategy: 'session'
        },
        handler: (req, reply) => {
          // First attempt to test if the cookie works
          // console.log(req.auth.credentials.access_token);
          // reply('Welcome to your profile!');

          // Make an API call to the Github API to get user details
          getUserDetails(req.auth.credentials.access_token, (err, res, body) => {
            if (err) throw err;
            reply(JSON.parse(body));
          })
        }
      }
  }
  ]);
});

server.start((err) => {
  if(err) throw err;
  console.log('Server is up and running at ', server.info.uri);
})
