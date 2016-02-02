var url = require('url');

exports.requestHandler = function(request, response) {
  console.log("Serving request type " + request.method + " for url " + request.url);
  
  var pathName = url.parse(request.url).pathname.split('/');
  
  if(pathName[1] === 'classes'){

    if(request.method === "GET"){

      var statusCode = 200;
      var headers = defaultCorsHeaders;
      headers['Content-Type'] = "application/json";

      response.writeHead(statusCode, headers);
      
      if(!Array.isArray(data[pathName[2]])){
        data[pathName[2]] = [];
      }
                  
      response.end(JSON.stringify( {results: data[pathName[2]] } ));

    } else if(request.method === "POST"){
        
      statusCode = 201;
      headers = defaultCorsHeaders;
      headers['Content-Type'] = "application/json";

      response.writeHead(statusCode, headers);
      
      request.on('data', function (newData) {
        if(!Array.isArray(data[pathName[2]])){
          data[pathName[2]] = [];
        }
        data[pathName[2]].push(JSON.parse(newData.toString()));
      });
    
      response.end(); 
    }
    
  } else {
    
    statusCode = 404;
    response.writeHead(statusCode);
    response.end(); 
  
  }
};

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var data = {};