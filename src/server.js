const http = require('http');
const url = require('url');
const query = require('querystring');

const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const handlePost = (request, response, parsedUrl) => {
  if (parsedUrl.pathname === '/addPost') {
    const res = response;

    const body = [];

    request.on('error', (err) => {
      console.dir(err);
      res.statusCode = 400;
      res.end();
    });

    request.on('data', (chunk) => {
      body.push(chunk);
    });

    request.on('end', () => {
      const bodyString = Buffer.concat(body).toString();
      const bodyParams = query.parse(bodyString);

      jsonHandler.addPost(request, res, bodyParams);
    });
  }
};

const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  switch (request.method) {
    case 'GET':
      if (parsedUrl.pathname === '/') {
        htmlHandler.getIndex(request, response);
      } else if (parsedUrl.pathname === '/style.css') {
        htmlHandler.getCSS(request, response);
      } else if (parsedUrl.pathname === '/pikaday.js') {
        jsonHandler.getPikaday(request, response);
      } else if (parsedUrl.pathname === '/pikaday.css') {
        htmlHandler.getPikadayCSS(request, response);
      } else if (parsedUrl.pathname === '/getPosts') {
        jsonHandler.getPosts(request, response, 'public');
      } else if (parsedUrl.pathname === '/getPrivatePosts.html') {
        htmlHandler.getSecrets(request, response);
      } else if (parsedUrl.pathname === '/getPrivatePosts') {
        const params = { admin: true };
        jsonHandler.getPosts(request, response, 'private', params);
      } else {
        jsonHandler.notFound(request, response);
      }
      break;
    case 'HEAD':
      if (parsedUrl.pathname === '/getPosts') {
        jsonHandler.getPostsMeta(request, response);
      } else if (parsedUrl.pathname === '/getPrivatePosts') {
        jsonHandler.getPrivatePostsMeta(request, response);
      } else {
        jsonHandler.notFoundMeta(request, response);
      }
      break;
    case 'POST':
      handlePost(request, response, parsedUrl);
      break;
    default:
      jsonHandler.notFound(request, response);
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);
