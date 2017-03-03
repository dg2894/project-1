const crypto = require('crypto');

const blog = {};
const privateBlog = {};

let etag = crypto.createHash('sha1').update(JSON.stringify(blog));
let digest = etag.digest('hex');

const respondJSON = (request, response, status, object) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  // console.log(JSON.stringify(object));

  // send response with json object
  response.writeHead(status, headers);
  response.write(JSON.stringify(object));
  response.end();
};

const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

const getPosts = (request, response, postType, params) => {

  console.log(params);

  // if (postType === 'private') {
  //   responseJSON = {
  //     privateBlog,
  //   }
  // } else {
  //   responseJSON = {
  //     blog,
  //   }
  // }

  if (postType === 'private') {
    if (!params.authorized || params.authorized !== 'true') {
      responseJSON = {
        message: 'Missing authorized query parameter set to true',
      };
      return respondJSON(request, response, 401, responseJSON);
    } else {
      responseJSON = {
        privateBlog,
      };
    }
  } else {
    responseJSON = {
      blog,
    };
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
  } else {
    responseCode = checkCode(blog, post);
  }

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';

    etag = crypto.createHash('sha1').update(JSON.stringify(blog));
    digest = etag.digest('hex');


    return respondJSON(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

function checkCode(currentBlog, post) {
  if (currentBlog.entries) {
    for (let i = 0; i < currentBlog.entries.length; i++) {
      if (currentBlog.entries[i].title === post.title && currentBlog.entries[i].entry === post.entry) {
        return 204;
      }
    }
  } else {
    currentBlog.entries = [];
  }

  writeBlog(currentBlog, post);
  return 201;
}

const writeBlog = (currentBlog, post) => {
  currentBlog.entries.push({
    "title": post.title,
    "date": post.date,
    "image": post.image,
    "entry": post.entry,
    "privacy": post.privacy
  });
}

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
  getPosts,
  getPostsMeta,
  addPost,
  notFound,
  notFoundMeta,
};
