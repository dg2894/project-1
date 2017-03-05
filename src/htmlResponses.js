const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);
const pikadayCSS = fs.readFileSync(`${__dirname}/../node_modules/pikaday/css/pikaday.css`);
const secrets = fs.readFileSync(`${__dirname}/../client/getPrivatePosts.html`);

const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getSecrets = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(secrets);
  response.end();
};


const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

const getPikadayCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(pikadayCSS);
  response.end();
};

module.exports = {
  getIndex,
  getSecrets,
  getCSS,
  getPikadayCSS,
};
