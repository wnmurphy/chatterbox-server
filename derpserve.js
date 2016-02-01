// Require node's http module.
var http = require('http');

var serve = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write("Hello World\n");
  res.end();
}).listen(8080);
console.log("Server running at http://localhost:8080");