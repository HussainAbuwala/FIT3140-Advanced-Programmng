var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var bodyParser = require('body-parser');
app.use(bodyParser());

app.get('/', function(req, res) {
   res.sendfile('myindex.html');
});

/**
   description: finds the number of players in a particular room
   param: roomNo
   return: count of players in the room
**/

function getRoomCount(roomNo) {
      var x
      if (io.sockets.adapter.rooms[roomNo] === undefined) {x = 0;}
      else {x = io.sockets.adapter.rooms[roomNo].length;}
      return x
}


/**
   description: When a user disconnects from the site, this function goes thorugh all rooms and check if a room has only one player to change the page
   param: none
   return: none
**/
function discon() {
    //find all rooms
    for (j = 0; j< rooms.length; j++) {
      if (getRoomCount(rooms[j]) === 1) {
         roomWelcome(rooms[j]);         
      }
    }
    
}

/**
   description: updates roomcount of a specific user
   param: roomNo
   param: user
   return: none
**/
function updateCount(user,roomNo) {
    io.sockets.connected[user].emit("roomCount",{roomNumber: roomNo, count : getRoomCount(roomNo)})
}


function roomLoop(socketid) {
   for (j = 0; j< rooms.length; j++) {
        updateCount(socketid,rooms[j]);
   }
}


/**
   description: finds all the players and update their count
   param: none
   return: none
**/
function userLoop() {
   var socketids = Object.keys(io.engine.clients)
    for (i = 0; i < socketids.length; i++) {
         roomLoop(socketids[i])
    }
}

/**
   description: shows welcome page for all users in that room
   param: room
   return: none
**/
function roomWelcome(room) {
    var socketids = Object.keys(io.sockets.adapter.rooms[room].sockets)
    for (i = 0; i < socketids.length; i++) {
         io.sockets.connected[socketids[i]].emit('roomWelcome',{roomNo: room, count: io.sockets.adapter.rooms[room].length, player: i+1})
    }
}

/**
   description: updates board for both players in a room
   param: data
   return: none
**/
function sendMove(data) {
    var socketids = Object.keys(io.sockets.adapter.rooms[data.roomNo].sockets)
    for (i = 0; i < socketids.length; i++) {
      if (data.player === 1) {
         io.sockets.connected[socketids[i]].emit('insertMove',{move: "X",cell: data.cell,player: 1})
      }
      else{
         io.sockets.connected[socketids[i]].emit('insertMove',{move: "O",cell: data.cell, player: 2})
      }
   }
}

/**
   description: sends message to the user from the server
   param: data
   param: msg
   param: color
   param: user
   return: none
**/
function sendMsg(data,msg,color,user) {
    var socketids = Object.keys(io.sockets.adapter.rooms[data.roomNo].sockets)
    for (i = 0; i < socketids.length; i++) {
      if (user !== socketids[i]) {
        io.sockets.connected[socketids[i]].emit('serverMsg',{message: msg,col: color})
      }
   }
}


/**
   description: resets board for both players in a room
   param: roomNo
   return: none
**/
function resetBoard(roomNo) {
   var socketids = Object.keys(io.sockets.adapter.rooms[roomNo].sockets)
   for (i = 0; i < socketids.length; i++) {
      io.sockets.connected[socketids[i]].emit('reset',"");
   }
}

/**
   description: creates an array of numbers from start to end with an offset
   param: start
   param: end
   param: step
   param: offset
   return: array of numbers
**/
function range(start, end, step, offset) {
  
  var len = (Math.abs(end - start) + ((offset || 0) * 2)) / (step || 1) + 1;
  var direction = start < end ? 1 : -1;
  var startingPoint = start - (direction * (offset || 0));
  var stepSize = direction * (step || 1);
  
  return Array(len).fill(0).map(function(_, index) {
    return startingPoint + (stepSize * index);
  });
  
}


/**
   description: sends message to client depending on WIN/DRAW/IT IS NEXT PLAYERS TURN
   param: data
   param: user
   return: none
**/
function handler(data,user) {
        
   var win = false;
   var row = data.cell[0];
   var col = data.cell[1];
   var mark;
   
  
      
      
   if (data.player === 1) {
      mark = 1
   }
   
   else {mark = 2}
    
   if (row + col === 2) { 
      win = chkantiDiag(data.board,mark)
   }
   
   if (row === col && win!==true) {
      win = chkDiag(data.board,mark)
   }
   
   if( win!== true){win = chkRow(row,data.board,mark)}
   if(win!== true) {win = chkCol(col,data.board,mark)}
    
   if (win === true)  {
      console.log("WINNER PLAYER " + data.player)
      sendMsg(data,"Player " + data.player + " is the WINNER!","lime")
      return
      //pMap.forEach(function (value,key,map){io.sockets.connected[key].emit("win", "WINNER IS PLAYER " + data.player);})
   }
    
   //console.log(moves.length);
   if (win === false && saviour[parseInt(data.roomNo)].length === 9) {
      console.log("Draw");
      sendMsg(data,"It is a DRAW!","orange");
      return
      //pMap.forEach(function (value,key,map){io.sockets.connected[key].emit("win", "IT IS A DRAW MATES");})
   }
         
   else{
      sendMsg(data,"It is Your Turn","yellow",user);
   }
   
}


/**
   description: checks if 3 in a row for the anti diagonal
   param: board
   param: mark
   return: true if 3 in a row, else false
**/
function chkantiDiag(board,mark) {
   var j = 2;
   for (i = 0; i < 3; i++) {
      if (board[i][j] !== mark) {
         return false
      }
      j = j - 1;
   }
   return true;
}

/**
   description: checks if 3 in a row for the diagonal
   param: board
   param: mark
   return: true if 3 in a row, else false
**/
function chkDiag(board,mark) {
   for (i = 0; i < 3; i++) {
      if (board[i][i] !== mark) {
         return false
      }
   }
   return true;
}

/**
   description: checks if 3 in a row for a specific row
   param: rindex
   param: board
   param: mark
   return: true if 3 in a row, else false
**/
function chkRow(rindex,board,mark) {
   for (i = 0; i < 3; i++) {
      if (board[rindex][i] !== mark ) {
         return false
      }
   }
   return true;
}

/**
   description: checks if 3 in a row for a specific column
   param: cindex
   param: board
   param: mark
   return: true if 3 in a row, else false
**/
function chkCol(cindex,board,mark) {
   for (i = 0; i < 3; i++) {
      if (board[i][cindex] !== mark ) {
         return false
      }
   }
   return true;
}

function attachMoveCtr() {
    
}


var moves = [];
var rooms = [];

var saviour = ["",[],[],[],[],[]];


io.on('connection', function(socket) {
   
   //asks the client side for total number of rooms
   socket.emit("getRooms","")
   
   //gets the total rooms and update count for the user
   socket.on("recieveRooms",function(data){  
         rooms = range(1,data);
         
         
         //console.log(rooms);
         roomLoop(socket.id);
         
      })
    
   //allow the user to join a room
   socket.on('reqRoom',function (room) {
       socket.join(room);
       moves = [];
       saviour[parseInt(room)] = [];

       userLoop();
       roomWelcome(room);



   })
   
   //reset board for players in a room
   socket.on("reset",function(data){
      moves = [];
      saviour[parseInt(data)] = []
      resetBoard(data);
   })
   
   //check if move is valid. If yes then check if game win/draw or nothing and then insert move into board
   socket.on("checkMove",function(data){
      console.log(saviour[parseInt(data.roomNo)])
      if (saviour[parseInt(data.roomNo)].length % 2 === 0 && data.player === 1) {
        //Send client approval to make move for Player 1
         data.board[data.cell[0]][data.cell[1]] = data.player
         sendMove(data)
         saviour[parseInt(data.roomNo)].push(1);
         handler(data,socket.id)

      }
      else if (saviour[parseInt(data.roomNo)].length % 2 !== 0 && data.player === 2){
        //Send client approval to make move for Player 2
         data.board[data.cell[0]][data.cell[1]] = data.player
         sendMove(data)
         saviour[parseInt(data.roomNo)].push(1);
         handler(data,socket.id)

      }
      else {
         socket.emit("wrongTurn","It is Not Your Turn");
      }
   })
   
   
   //leave room for user
   socket.on('leaveRoom',function(data){
     socket.leave(data)
     socket.emit('ShowHome',{roomNo: data, count: getRoomCount(data)});
     userLoop();
     if (getRoomCount(data) !== 0) {roomWelcome(data)}
   })
   
   //when user disconnects, update room count for each player.
   socket.on('disconnect', function () { 
     userLoop()
     discon();
     })
   })




http.listen(3000, function() {
   console.log('listening on localhost:3000');
});