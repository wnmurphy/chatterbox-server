exports.requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);

  // handle GET
  if(request.method === "GET"){

    var statusCode = 200;

    var headers = defaultCorsHeaders;

    headers['Content-Type'] = "application/json";

    response.writeHead(statusCode, headers);
    
    response.write('{"results": ' + JSON.stringify(data.messages) + '}');

    response.end();

  } else if(request.method === "POST"){
//    if(request.url === "/classes/messages/"){
      
      var statusCode = 201;

      var headers = defaultCorsHeaders;

      headers['Content-Type'] = "application/json";

      response.writeHead(statusCode, headers);
      
      request.on('data', function (stuff) {
        console.log(stuff.toString());
        data.messages.push(JSON.parse(stuff.toString()));
        console.log(JSON.stringify(data.messages));
      });

      // JSON.stringify(request.json)

      response.end(); 
  }

};

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var data = {
  messages: []
};