//import the websocket library. There are many, but socket.io is one of the most common and feature rich
var socketio = require('socket.io');

//start a socketio server (port 18000 is arbitrary) and grab the server as io
var io = socketio.listen(18000);

//object to hold all of our connected users
var users = {};

//function to attach a handler for when people join
var onJoined = function(socket) {

    //attach the custom 'join' event to the socket.
    //Essentially this is the message type and they are all custom
    //You don't have to use the word 'join'. You can name the events whatever you want as long as they are unique.
    //On any message type event, the function specified will be called and automatically sent the message data
    //In this code, I have a function that takes the message data in as 'data'
	socket.on("join", function(data) {
    
        //json message to send back to the socket
        //All of the data inside of this message is custom
        //I could put anything I want into this message. 
        //In this case, I put a name field and a msg field.
        var joinMsg = {
            name: 'server', 
            msg: 'There are ' + Object.keys(users).length + ' users online'
        };
    
        //send a message of message type 'msg' back to the client socket sending the joinMsg json
        //We are calling the socket's emit method which will send a message back to that socket
        //The emit method takes a message type and data. 
        //In this case I gave it the msg type 'msg' and json
		socket.emit('msg', joinMsg);
		
        //since we can manipulate objects in JS, I am adding a name field to this socket itself.
        //This is all custom so I can assume my client will send message of type 'join' that will
        //have a field in it called 'name' which will be their username. I want to store the name they sent
        //with the socket itself, so I am pulling from the message packet's name field and putting it into
        //the socket as 'name'. Now anywhere I have this socket, I will know that client's name
		socket.name = data.name;
	
        //add this user's name to our list of users. We just use this list as a convenient way to see who is online
        //instead of going through all of the sockets each time to count and find names. 
        //add a property to the username object to hold the user's name. I could store more, but I am just storing
        //the user's name for now
		users[socket.name] = socket.name;
		
        //add this socket to a specified room
        //socketio has a built in method for handling groups of connections
        //This is referred to as 'rooms'. A socket can be in any number of rooms.
        //A room is just a set of socket connections to handle together
        //This could be a chat room, an individual game session, etc. Anything that has a grouping of socket connections.
        //socket rooms are uniquely named and they can be named anything. 
        //In this case, I just name it room1 for convenience. 
        //The socket's join method adds this socket to a room
		socket.join('room1');
		
        //A socket's broadcast function allows it to send a message to all sockets in a 
        //room that this socket is in EXCEPT FOR THE SOCKET SENDING THE MESSAGE. 
        //That is, this socket can send a message to everyone in a room except for itself. 
        //Unlike io.sockets.in, socket.broadcast.to sends to everyone except for itself
        //io.sockets.in sends to everyone in a room.
        //A socket can only broadcast to one of the rooms it is in.
        //This emits a message of type 'msg' to room1 and sends some json saying who joined the room.
		socket.broadcast.to('room1').emit('msg', { name: 'server', msg: data.name + " has joined the room."} );
		
		console.log(data.name + ' joined');
		
        //Emit a message back to this client socket of type 'msg' notifying them they successfully joined the room
		socket.emit('msg', {name: 'server', msg: 'You joined the room'});
	});
};

//function to attach a handler for when people send a message
var onMsg = function(socket) {
    //attach the custom 'msg' event to the socket.
    //Essentially this is the message type and they are all custom
    //You don't have to use the word 'msg'. You can name the events whatever you want as long as they are unique.
    //On any message type event, the function specified will be called and automatically sent the message data
    //In this code, I have a function that takes the message data in as 'data'
	socket.on('msg', function(data) {
        //for all of the sockets in room1, send a message of type 'msg' and this json data
        //io.sockets.in asks the server for all sockets in room1. 
        //Unlike socket.broadcast.to, io.sockets.in sends to everyone in the room
        //socket.broadcast.to sends to everyone EXCEPT the socket sending the message
		io.sockets.in('room1').emit('msg', {name: socket.name, msg: data.msg});
	});
};

//function to attach a handler for when people disconnect
var onDisconnect = function(socket) {
    //attach the 'disconnect' event to the socket.
    //The 'disconnect' event is one of the very few built-in message types, such as 'reconnect', 'connect' and 'error'
    //This event is automatically fired when a client socket disconnects
	socket.on("disconnect", function(data) {
        //broadcast to everyone except for the disconnected socket that this person left
        //This socket disconnected, so we can no longer send messages to it. 
        //Instead we will broadcast to everyone else in room1
		socket.broadcast.to('room1').emit('msg', {name: 'server', msg: socket.name + " has left the room."});
        
        //remove this socket from the specified room. A socket may be in more than one room, so 
        //if you are using more than one room, you may need to disconnect the socket from several rooms
        //the leave method removes the socket from the group of sockets known as a 'room'
		socket.leave('room1');
        
        //we will also remove the user from users object we made since they are no longer connected
		delete users[socket.name];
	});
};

console.log('starting up');

//tell the server what to do when new sockets connect
//'connection' is a built-in event from socketio that fires any time a new connection occurs
//The 'connection' event automatically sends the newly connected socket to the function 
io.sockets.on("connection", function(socket) {

    console.log('started');
    
    //call the functions to attach handlers and send in the new socket connect
    onJoined(socket); //pass socket to onJoined to attach joined event
    onMsg(socket); //pass socket to onMsg to attach message event
    onDisconnect(socket); //pass socket to onDisconnect to attach disconnect event
	
});

