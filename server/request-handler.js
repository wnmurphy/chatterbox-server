var url = require('url');

exports.requestHandler = function(request, response) {
  console.log("Serving request type " + request.method + " for url " + request.url);
  
  var pathName = url.parse(request.url).pathname.split('/');
  var query = url.parse(request.url, true).query;

  if(pathName[1] === 'classes'){

    if(request.method === "GET"){

      var statusCode = 200;
      var headers = defaultCorsHeaders;
      headers['Content-Type'] = "application/json";

      response.writeHead(statusCode, headers);
      
      if(!Array.isArray(data[pathName[2]])){
        data[pathName[2]] = [];
      }
      
      var results = filterByTime(data[pathName[2]], query);
      
      response.end(JSON.stringify( {results: results } ));

    } else if(request.method === "POST"){
        
      statusCode = 201;
      headers = defaultCorsHeaders;
      headers['Content-Type'] = "application/json";

      response.writeHead(statusCode, headers);
      
      request.on('data', function (newData) {
        if(!Array.isArray(data[pathName[2]])){
          data[pathName[2]] = [];
        }
        var newMessage = JSON.parse(newData.toString());
        newMessage.createdAt = Date.now();
        data[pathName[2]].push(newMessage);

      });
    
      response.end(); 

    } else if(request.method === "OPTIONS"){
      
      statusCode = 200;
      headers = defaultCorsHeaders;
      headers['Content-Type'] = "application/json";
      response.writeHead(statusCode, headers);
      response.end();
      
    }
    
  } else {
    
    statusCode = 404;
    response.writeHead(statusCode);
    response.end(); 
  
  }
};

var filterByTime = function(array, query){
  var filterObject;
  // If where is not empty, pull out '{"$gt":1454438415229}}',
  if(query.where){  
    filterObject = JSON.parse(query.where).createdAt;
    var limit = Number.parseInt(query.limit);
    var direction = null;
    var timeStamp = null;
    
    // Get direction and timeStamp from filterObject
    for(var key in filterObject){
      direction = key;
      timeStamp = filterObject[key];
    }
    
    // filter messages by direction
    var timeIndex = binarySearch(array, timeStamp);
    
    if(direction === '$gt') {
      return array.slice(timeIndex+1, timeIndex + limit + 1);
    }else{
      return array.slice(timeIndex-limit, timeIndex);
    }
  } else {
    return array.slice(array.length - Number.parseInt(query.limit) - 1);
  }

};

var binarySearch = function (array, target, start, end) {
  start = start || 0;
  end = end || array.length - 1;
  var index = start + Math.floor((end-start)/2);

  if (array[index].createdAt === target) {
    return index;
  }
  if (end === start) {
    return -1; 
  }
  if (target < array[index].createdAt) {
    return binarySearch(array, target, start, index - 1);
  } else {
    return binarySearch(array, target, index + 1, end);
  }
}

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var data = {};