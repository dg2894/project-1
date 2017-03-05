const crypto = require('crypto');
const fs = require('fs');

const pikaday = fs.readFileSync(`${__dirname}/../node_modules/pikaday/pikaday.js`);

const blog = {};
const privateBlog = {};

let etag = crypto.createHash('sha1').update(JSON.stringify(blog));
let digest = etag.digest('hex');

const getPikaday = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/javascript' });
  response.write(pikaday);
  response.end();
};

// const writeHTML = (object) => {
//   let html = '';
//   if (object.entries) {
//     for (let i = 0; i < object.entries.length; i++) {
//       html += "<div class='entry'>";
//       html += `<h3>${object.entries[i].title}</h3>`;
//       if (object.entries[i].image) {
//         html += `<img class='entry-img' src='${object.entries[i].image}'/>`;
//       }
//       html += `<p>${object.entries[i].date}</p>`;
//       html += `<p>${object.entries[i].entry}</p>`;
//       html += '</div>';
//       return html;
//     }
//   }
//   html += '<p>There are no entires.</p>';
//   return html;
// };

const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  // send response with json object
  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

// const respondHTML = (request, response, status, object) => {
//   const headers = {
//     'Content-Type': 'text/html',
//     etag: digest,
//   };

//   let html = '';

//   if (object.message) {
//     html = `<b>${object.title}</b>`;
//     html += `<p>${object.message}</p>`;
//   } else {
//     html = writeHTML(object.privateBlog, html);
//   }

//   response.writeHead(status, headers);
//   response.write(html);
//   response.end();
// };

const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

const getPosts = (request, response, postType, params) => {
  let responseJSON = { blog };
  if (postType === 'private') {
    if (!params.admin || params.admin !== true) {
      responseJSON = {
        title: 'Unauthorized',
        message: 'Missing admin query parameter set to true',
      };
      return respondJSON(request, response, 401, responseJSON);
    }
    responseJSON = { privateBlog };
    return respondJSON(request, response, 200, responseJSON);
  }

  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }

  return respondJSON(request, response, 200, responseJSON);
};

const getPostsMeta = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }

  return respondJSONMeta(request, response, 200);
};

const getPrivatePostsMeta = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }
  return respondJSONMeta(request, response, 401);
};

const writeBlog = (currentBlog, post) => {
  currentBlog.entries.push({
    title: post.title,
    date: post.date,
    image: post.image,
    entry: post.entry,
    privacy: post.privacy,
  });
};

const checkCode = (currentBlog, post) => {
  if (currentBlog.entries) {
    for (let i = 0; i < currentBlog.entries.length; i++) {
      if (currentBlog.entries[i].title === post.title
        && currentBlog.entries[i].entry === post.entry) {
        return 204;
      }
    }
  } else {
    return 404;
  }

  writeBlog(currentBlog, post);
  return 201;
};

const addPost = (request, response, post) => {
  const responseJSON = {
    message: 'Date and entry are required',
  };

  if (!post.date || !post.entry) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  let responseCode = 201;

  if (post.privacy === 'private') {
    responseCode = checkCode(privateBlog, post);
    if (responseCode === 404) {
      privateBlog.entries = [];
      responseCode = 201;
      writeBlog(privateBlog, post);
    }
  } else {
    responseCode = checkCode(blog, post);
    if (responseCode === 404) {
      blog.entries = [];
      responseCode = 201;
      writeBlog(blog, post);
    }
  }

  if (responseCode === 201) {
    responseJSON.message = 'See posts below';

    etag = crypto.createHash('sha1').update(JSON.stringify(blog));
    digest = etag.digest('hex');


    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

const notFound = (request, response) => {
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  respondJSON(request, response, 404, responseJSON);
};

const notFoundMeta = (request, response) => {
  respondJSONMeta(request, response, 404);
};

module.exports = {
  getPikaday,
  getPosts,
  getPostsMeta,
  getPrivatePostsMeta,
  addPost,
  notFound,
  notFoundMeta,
};
