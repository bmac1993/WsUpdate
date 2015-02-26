//import the websocket client library. We are using socket.io which is one of the most common and feature rich libraries.
//In this case we import the client library, not the server.
var io = require('socket.io-client');

//Tell the library to connect to the address/port specified (can accept a couple different protocols, not just http).
//and get the connected socket back.
var socket = io.connect('http://localhost:18000');

//aliasing stdin for convenience. This is so we can take command line input
var stdin = process.stdin;

//creating a somewhat random username to use. You could, of course, read this in from the command line or something
var user = 'user' + (Math.floor((Math.random()*1000)) + 1);

console.log('connecting');

//connect the socket's connect event to fire this function upon connect.
//'connect' is a built-in function of socketio clients and is fired once the socket connects
socket.on("connect", function() {
    console.log("connected");
    
    //send a message of type 'join' to the server and pass in json with a name field to hold the username
    //The 'join' function is a custom message type and can be called anything as long as it is unique.
    //The server will need to be able to read the same message types
    //The socket's emit function sends a message out to the server
    socket.emit('join', { name: user});
    
    //connect the 'msg' message type for this socket
    //'msg' is a custom message type. You can call it whatever you want as long as it is unique.
    socket.on('msg', function(data) {
        //upon receiving a message, just print it out
        console.log(data.name + ": " + data.msg);
    });
    
    //listen to the command line input and any time a 'data' event fires (when the user hits enter)
    //pass the data to this function
    stdin.on('data', function (data) {
        //take the data from the command line
        //and send it to the server using the socket's emit method
        //In this case the data sent to the server is json containing the msg and the username
        socket.emit('msg', { msg: data, name: user});
    });
});



