// YOUR CODE HERE:

var app = {
  //------------------------PROPERTIES-----------------------//
  _server: 'https://api.parse.com/1/classes/chatterbox',
  _initialized: false,
  _refVariables: {},
  

  //--------------------------METHODS------------------------//
  
  //--------------------------LOADING------------------------//
  // initialized messages window with messages already on server
  init: function () {
    
    // set properties to initial values
    app._rooms = {};
    app._users = {};
    app._friends = {}
    app._messages = [];
    app._current = 'showAll';
    app._nextQuery = {refresh: '', load: ''};
    app._user = escape(window.location.search.substr(10));
    
    // initialize $ reference variables
    app.initRef();
    
    //reset scroll to top of feed
    app.$chat.scrollTop(35);
    
    // clear loaded messages
    app.clearMessages();
    
    app.fetch('load');
  },
  
  clearMessages: function () {  
    // remove all messages
    app.$messages.remove();
    
    // remove all rooms from room select
    app.$roomOptions.remove();
    
    // replace original options
    app.$roomSelect.append('<option value="addRoom">New room...</option>');
    app.$roomSelect.append('<option value="showAll">Show all messages</option>');
    app.$roomSelect.val('showAll');
  },
  
  // initialize main references that will need to be used
  initRef: function () {
    app.createRef('messages', '.message');
    app.createRef('roomOptions', 'option');
    app.createRef('roomSelect', '#roomSelect');
    app.createRef('chat', '#chat');
    app.createRef('feed', '#feed');
    app.createRef('messageText', '#messageText');
    app.createRef('spinner', '.spinner');
    app.createRef('refresh', '#refresh');
    app.createRef('noMessages', '#noMessages')
  },

  //---------------------------AJAX--------------------------//
  // sends a new message
  send: function (message) {
    $.ajax({       url: app._server, 
                  data: JSON.stringify(message), 
           contentType: 'application/json',
                  type: 'POST',
            statusCode: {
              201: function (data) {
                app.fetch('refresh');
              } }
    });
  },

  // collects messages on the server
  fetch: function (loadOrRefresh) {
    app.$spinner.show();
    
    // sets data processor
    if (loadOrRefresh === 'load') {
      var processData = app.processLoad;
    } else {
      var processData = app.processRefresh;
    }
    
    // sends a GET request to url
    $.ajax({ url: app._server, 
            data: {
                   'limit': 100, 
                   'where': app._nextQuery[loadOrRefresh], 
                   'order': '-createdAt'}, 
         success: processData
    });
  },
  
  //---------------------DATA-PROCESSING----------------------//
  
  processLoad: function (data) {

    // stores messages 
    app._messages = app._messages.concat(data.results);
    
    if (data.results.length > 0) {
      // sets start point for load
      app._nextQuery['load'] = JSON.stringify({"createdAt": {"$lt": data.results[data.results.length-1].createdAt}});
      
      // sets start point for refresh if one hasn't been set
      if (app._nextQuery['refresh'] === '') {
        app._nextQuery['refresh'] = JSON.stringify({"createdAt": {"$gt": data.results[0].createdAt}});
      }
      
      // creates count of messages added to current view
      var viewCount = 0;
      // populates new messages to dom
      for (var i = 0; i < data.results.length; i++){
        viewCount += app.addMessage(data.results[i], 'load');
      }
    } 

    // runs if this load is part of the initialization
    if (!app._initialized) {
      app.$noMessages.text('No messages to display');
      app._initialized = true;
    }
    app.$spinner.hide();
  },
  
  processRefresh: function (data) {

    // stores messages 
    app._messages = app._messages.concat(data.results);
    
    // assumes there is more to refresh
    var done = false;

    if (data.results.length > 0) {
      //
      // sets start point for refresh
      app._nextQuery['refresh'] = JSON.stringify({"createdAt": {"$gt": data.results[0].createdAt}});
      
      // populates all the new messages
      for (var i = data.results.length - 1; i >= 0; i--){
        app.addMessage(data.results[i], 'refresh');
      }
      
    } else {
      // sets done to true if data has no results
      done = true;
    }
    
    if (done) {
      app.$chat.animate({scrollTop:35}, 300, 'swing');
      app.$spinner.hide();
    } else {
      app.fetch('refresh');
    }
    
  },
  
  //---------------------DOM-INTERACTION----------------------//
  
  // creates message from text entered in form
  createMessage: function () {
    var message = {
          text: escape(app.$messageText.val()),
      username: app._user,
      roomname: app.$roomSelect.val()
    }
    
    // resets input field
    app.$messageText.val('');
    
    // send message
    app.send(message);
  },
    
  // adds room to the DOM
  addRoom: function (room) {
    app.$roomSelect.append('<option id="' + room + '">' + room +'</option>');
    app.$roomSelect.val(room);
  },
  
  // friends users
  addFriend: function (username) {
    if (app._friends[username]) {
      app._friends[username] = false;
      // for each node of this user remove friend class
      $.each(app._users[username], function (i, $node) {
        $node.removeClass('friend');
      });
    } else {
      // for each node of this user add friend class
      app._friends[username] = true;
      $.each(app._users[username], function (i, $node) {
        $node.addClass('friend');
      });
    }
  },

  // adds messages to page
  addMessage: function (message, loadOrRefresh) {
    var messageText = escape(message.text);
    
    // does not add messages with no content
    if (messageText.trim() === '') {
      return;
    }
    
    // if message has no username, use anonymous
    var name = message.username || 'anonymous';
    name = escape(name);
    
    // creates username jquery object
    var $user = $('<h2 class="username">' + name + '</h2>');
    // makes username clickable
    $user.click(function () {
      app.addFriend(name);
    });
    
    // stores an escaped version of provided room name, with default of lobby
    var roomname = escape(message.roomname) || 'lobby';
    
    // uses 'lobby' for room names reserved by this client 
    if (roomname === 'addRoom' || roomname === 'showAll') {
      roomname = 'lobby';
    }
        
    // create new jquery object for message div
    var $newMessage = $('<div class="message"></div>');
    
    // add username
    $newMessage.append($user);
    // add content
    $newMessage.append('<p>' + escape(messageText) + '</p>');
    // add timestamp
    $newMessage.append('<h3 class="timestamp">' + message.createdAt + '</h3>');
    
    // hides new message so there can be entry animation
    $newMessage.hide();
    
    // add message to chats section of page
    if (loadOrRefresh === 'load') {
      app.$feed.append($newMessage);
    } else {
      app.$feed.prepend($newMessage);
    }
    
    // shows message if message is in current room or show all is selected
    if (message.roomname === app._current || app._current === 'showAll') {
      $newMessage.slideDown();
      app.$noMessages.hide();
    }
    
    // checks to see if room to be added to is still set to true
    if (app._rooms[roomname] === undefined) {
      // stores jquery object in array
      app._rooms[roomname] = [$newMessage];
      app.addRoom(roomname);
    } else {
      // adds to room jquery selector in rooms object for quick reference later
      app._rooms[roomname].push($newMessage);
    }
    
    // add all messages to users object
    // checks to see if room to be added to is still set to true
    if (app._users[name] === undefined) {
      // stores jquery object array
      app._users[name] = [$newMessage];
    } else {
      // adds to room jquery selector in rooms object for quick reference later
      app._users[name].push($newMessage);
    }
    
    // highlights messages added from someone already in friends list
    if (app._friends[name]) {
      $newMessage.addClass('friend');
    }
    
    // updates messages jquery reference
    app.updateRef('$messages');
    
    // sets room select to current room
    app.$roomSelect.val(app._current);

  },
  
  // handles creation of new room
  createRoom: function () {
    // ask user what they want to name the new room
    var newRoomName = escape(prompt('What would you like to call the new room?'));
    
    // checks to see if one of reserved names
    if (newRoomName === 'showAll' || newRoomName === 'addRoom') {
      alert('"'+newRoomName + '" is a reserved name. If you would like to create a new room, please select "New room..." again.');
      selected = app._current;
      
    // checks to see if room already exists
    } else if (app._rooms[newRoomName]) {
      alert('"'+newRoomName + '" is already a room name. If you would like to create a new room, please select "New room..." again.');
    
    // checks to see if room name is empty string
    } else if (newRoomName.trim() === '') {
      alert('Empty room names are not allowed. If you would like to create a new room, please select "New room..." again.');
    
    // adds new room if valid new room name
    } else {
      app.addRoom(newRoomName);
      app._current = newRoomName;
      app.$messages.hide();
      app.$noMessages.show();
    }
    
    app.$roomSelect.val(app._current);
  },
  
  // handles the roomSelect drop down menu
  roomChange: function () {
    
    // saves the currently selected value
    var selected = app.$roomSelect.val();
    
    // if selected "New room..."
    if (selected === 'addRoom') {
      return app.createRoom();
    }
    
    app.fetch('refresh');
    
    // show no messages
    app.$noMessages.show();
    app.$messages.hide();

    // shows all if show all selected
    if (selected === 'showAll') {
      app.$messages.show();
      
      // if there is more in feed than no messages div
      if (app.$feed.children().length > 1){
        // hide no messages div
        app.$noMessages.hide();;
      }
      
    } else {
      if (Array.isArray(app._rooms[selected])) {
        // shows all messages in selected rooms
        $.each(app._rooms[selected], function (i, $node) {
          $node.show();
        });
        app.$noMessages.hide();;
      }
    }
    
    // keep track of current room
    app._current = selected;

  },
  
  //--------------------------HELPERS------------------------//
  // create jquery variable for easier calling
  createRef: function (key, selector) {
    app['$' + key] = $(selector);
    app._refVariables[key] = selector;
  },
  
  // update jquery reference variables
  updateRef: function (ref) {
    if (ref[0] === '$') {
      // drop $ from ref name
      ref = ref.substr(1);
      // recreates reference
      app.createRef(ref, app._refVariables[ref]);
    } else {
      console.error('updateRef can only update variables that begin with \'$\'.');
    }
  }
  
}

var escape = function (string) {
  return _.escape(string);
}


// creates app
$(window).bind("load", function() {
  app.init();
  app.$roomSelect.change(app.roomChange);
  
  // implement scroll to refresh
  app.$chat.scroll(function (event) {
    var scroll = app.$chat.scrollTop();
    if (scroll === 0) {
      app.fetch('refresh');
    }
    if (scroll + $(this).innerHeight() === $(this)[0].scrollHeight) {
      app.fetch('load');
    }
  });
  
  // prevent return from using form send action
  $(window).keydown(function(event){
    if(event.keyCode === 13) {
      event.preventDefault();
      // call send when return is hit
      app.createMessage();
    }
  });
});
