// ########## DEPENDENCIES ########## 
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongojs = require('mongojs');
const bcrypt = require('bcrypt');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);


// ########## GLOBAL VARIABLES ##########
const port = 5000;
const DB_URL = 'mongodb://admin:lala1234@ds111765.mlab.com:11765/messenger';
const socketids = [];
const salt = bcrypt.genSaltSync(10);

// ########## DATABASE CONNECTION ##########
db = mongojs(DB_URL);
db.on('error', (err) => {
  console.log('database error', err)
});

db.on('connect', () => {
  console.log('database connected')
});


// ########## MIDDLEWARE ##########
const sessConfig = {
  name: 'sid',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
  ,
  // cookie: {
  //   maxAge: 1000*60*60,
  //   sameSite: true
  // }
  // ,
  store: new MongoStore({
    url: DB_URL,
    ttl: 60*60, //(sec*min*hour*day)
    autoRemove: 'native'
  })
};

app.use(session(sessConfig));
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: '*'}));
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/client/messenger'));

// check if the user is already logged in
let authenticate = (req, res, next) => {
  console.log(req.session.username);
  if(!req.session.username){
    res.redirect('/login');
  }
  else{
    next();
  };
};


// ######### VIEW ROUTES #########

// landing
app.get('/', authenticate, (req, res) => {
  res.redirect(307, '/login');
});


// login
app.get('/login', (req, res) => {
  res.sendFile(__dirname+ '/client/login/login.html');
});


// messenger desktop (width > 402)
app.get('/messenger', authenticate, (req, res) => {
  res.sendFile(__dirname+ '/client/messenger/desktop.html');
});


// messenger mobile (width < 402)
app.get('/mobile', authenticate, (req, res) => {
  res.sendFile(__dirname+ '/client/messenger/mobile.html');
});


// ########## REGISTRATION ROUTE ##########
app.post('/api/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password1;


  // Check if name is available
  db.User.findOne({name:name}, (err, result) => {
    if(err){
      console.error(err);
    }
    else if(result){
      console.error('name not valid');
      res.json({name: false})
    }
    else{
      // Check if email is available
      db.User.findOne({email:email}, (err, result2) => {
        if(err){
          console.error(err);
        }
        else if(result2){
          console.error('email not valid');
          res.json({email: false})
        }
        else{
          // if both NAME and EMAIL are available a new user will be added to the db

          // hash the user pw
          const hashedPassword = bcrypt.hashSync(password, salt);
          // hash the id based on the name
          const id = bcrypt.hashSync(name, salt);

          // fill the user object
          const userData = {
            id: id,
            name: name,
            email: email,
            picture: "link",
            status: "I am a new user",
            rooms:[],
            isLoggedIn: false,
            dateOfRegistration: new Date()
          };

          // create a password object with reference to the user
          const pw = {
            id: id,
            password: hashedPassword
          };

          const contact = {};

          // add the pw object to pw db
          db.Passwords.save(pw, (err) => {
            if(err){
              console.error(err)
            }
            else{
              console.log('pwObject saved');
            };
          });

          // add the pw object to pw db
          db.Contacts.save(contact, (err) => {
            if(err){
              console.error(err)
            }
            else{
              console.log('contact saved');
            };
          });

          // add the user
          db.User.save(userData, (err) => {
            if(err){
              console.error(err);
            }
            else{
              console.log('user registered');
              res.json({'message':'success'});
            };
          });
        };
      });
    };
  });
});


// ########## LOGIN ROUTE ##########
app.post('/api/login', (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  // checking for username
  db.User.findOne(
    {name: name},
    (err, user) => {
    if (err) {
      console.error(err);
    } else if (!user) {
      res.json({
        'message': 'no user'
      });
    } else {
      // try to find a password paired with the name hash
      db.Passwords.findOne({id:user.id}, (err, result) => {
        if(err){
          console.error(err);
        }
        else if(result == null){
          console.log('no pw object found');
        }
        else{
          // getting pw from password collection to compare
          bcrypt.compare(password, result.password).then((response) => {
            if (!response) {
              console.log('password wrong!');
              res.json({
                'login': false
              });
            } else {
              // Updating the isLoggedIn status
              // db.User.update({name: name}, {$set: {isLoggedIn: 'true'}},
              //   (err) => {
              //     if(err){
              //       console.error(err);
              //     };
              //   });
              activeUser = name;
              console.log('loggin in...');
              req.session.username = name;
              req.session.userID = user.id
              console.log(req.session.username);
              res.json(data = {
                name: name,
                isLoggedIn: true
              });
            };
          })
          .catch((err) => console.error(err));
        };
      });
    };
  });
});


// ########## LOGOUT ROUTE ##########
app.get('/api/logout', authenticate, (req, res) => {
  req.session.destroy();
});


// ########## GET CONTACT LIST ##########
app.get('/api/getContacts', authenticate, (req, res) => {
  const username = req.session.username;

  db.User.findOne({name:username}, (result) => {
      if(result == null){
        console.log('Something went wrong 248');
      }
      else{
        db.Contacts.findOne({id: result.id}, (err, data) => {
          if(err) {
            console.error(err);
          }
          else if (!data) {
            console.log('no data (231)');
            res.json({
              'message': 'no data'
            });
          }
          else {
            console.log(data);
            res.json(data);
          };
        });
      }
   });
  })


// ########## ADD A CONTACT ##########
app.post('/api/addContact', authenticate, (req, res) => {
  const contactName = req.body.name;
  const username = req.session.username;
  let id = '';

  // get user's id
  db.Users.findOne({name:username}, (err, result) => {
    if(err){
      console.error(err);
    }
    else if(result == null){
      console.log('error 280');
    }
    else{ 
      id = result.id;
    };
  });

  // check if a user with given name exists
  db.User.findOne({
    name: contactName
  }, (err, user) => {
    if (err) {
      console.error('Error while adding a user ' + err);
      res.json({
        'message': 'Database error'
      });
    } else if (user == null) {
      console.log('No user found (228)');
      res.json({
        'message': 'no user'
      });
    } else {
      // add the new contact to user's contact array
      contactObj = {
        name: req.session.username,
        userID: req.session.userID,
        contactID: user.id,
        name: user.name,
        email: user.email
      };
      db.Contacts.save(contactObj,
      (err) => {
        if(err){
          console.error(err);
        }
        else{
          console.log('contact added');
          res.json(contactObj);
        }
      });
    };
  });
});


// ########## GET USER'S DATA ##########
app.get('/api/data', authenticate, (req, res) => {
  let username = req.session.username;
  let data = [];
  let msgArr = [];

  db.User.findOne({name:username}, (err, result) => {
    if(err){
      console.error(err);
    }
    else if(result == null){
      console.log('no user found');
      res.json('no user found');
    }
    else{
      data.push(result);

      db.Contacts.find({userID:result.id}, (err, contacts) => {
        if(err){
          console.error(err);
        }
        else if(contacts == null){
          console.log('no contacts found');
        }
        data.push(contacts);

        db.Messages.find({}, (err, messages) => {
          if(err){
            console.error(err);
          }
          else if(messages == null){
            console.log('no messages found');
          }
          else{
            for(let el of messages){
              if(el.sender == username || el.recipient == username){
                msgArr.push(el)
              };
            };
            data.push(msgArr);
            res.json(data);
          };
        });
      });
    };
  });
});


// ########## UPDATE READ STATUS FOR MESSAGES ##########
app.get('/api/updatemsgstatus/:sender', authenticate, (req, res) => {
  const username = req.session.username;
  const sender = req.params.sender;

  console.log(username);
  db.Messages.update({recipient:username, sender:sender}, {$set: {isRead: true}}, {multi: true}, (err,result) => {
      if(err){
        console.error(error);
      }
      else{
        console.log('updated status');
        console.log(result);
      };
  });
});


// ########## SEND MESSAGE ##########
app.post('/api/send', authenticate, (req, res) => {
  const msg = req.body.body;
  const recipient = req.body.recipient;
  const sender = req.body.sender; 
  const date = req.body.date;
  const msgID = req.body.msgID;
  const isRead = req.body.isRead;
  const roomNumber = Math.round(Math.random(1)*10000);
  const arr = [];

  // room object for creating the socketio private convo
  const room = {
    member1: sender,
    member2: recipient,
    roomNumber: roomNumber
  };

  // message object with all the necessary data
  const msgObj = {
    msgID: msgID,
    body: msg,
    date: date,
    isRead: isRead,
    recipient: req.body.recipient,
    sender: req.body.sender
  };

  // check if there a is a socketio room for the conversation.
  //  if not, create one.
  db.User.findOne({name:sender}, (err, result) => {
    if(err){
      console.error(err);
    }
    else if(result == null){
      console.log('no data found');
    }
    else{
      console.log('user found');
      test = result;
      // if there is a room containing the members of this room
      // dont push the object to 'rooms'. If there is not a 
      // room add the object to the room array of both members.
      for(let el of result.rooms){
        if((el.member1 === sender && el.member2 == recipient) ||
          (el.member1 === recipient && el.member2 == sender) ){
          arr.push('1');
        };
      };
    
      if(arr.length == 0){
        db.User.update({name: sender}, {$push: {rooms : room}});
        db.User.update({name: recipient}, {$push: {rooms : room}});
      };
    };
    res.json(result);
  });

  // save message in database
  db.Messages.save(msgObj, (err) => {
    if(err){
      console.error(err);
      res.json('could not send message');
    }
    else{
      console.log('msg sent');
      console.log(msgObj);
    };
  });
});

// ########## SOCKETIO STUFF ##########
io.on('connection', function(socket){
  // console.log('a user connected '+socket.id);
  socket.on('SEND_MESSAGE', (msg) => {
    console.log(`Message: ${msg}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);

    for(let i = 0; i < socketids.length; i++){
      if(socketids[i].socketID == socket.id){
        socketids.splice(i,1);
        console.log(`Number of clients: ${socketids.length}`);
      };
    };
  });

  // subscribe to all chats
  socket.on('subscribe', (room) => {
    console.log(`Joining room: ${room}`);
    socket.join(room);
    console.log(socket.id);
  });
  
  // send pm 
  socket.on('send message', (data) => {
    socket.broadcast.to(data.room).emit('private message', data);
  });

  // typing status
  socket.on('typing', (data) => {
    socket.broadcast.to(data.room).emit('typing...', {
      status: data.status,
      sender: data.sender
    });
  });

  // online status
  socket.on('online status', (data) => {
    console.log(`${data.sender} is ${data.status}`);
    socket.broadcast.emit('online status...', data);
  });
});


// ######### GET SOCKETIDS #########

app.post('/api/socketdata', (req, res) => {
  const socketID = req.body.socketID; 
  const username = req.session.username;

  const data = {
    socketID : socketID,
    username : username
  };

  console.log(`${username} : ${socketID} || l.461`);
  socketids.push(data);
  console.log(`Number of clients: ${socketids.length}`);
  res.json(data);
});

app.get('/api/getSocketID/:contact', authenticate, (req, res) => {
  contact = req.params.contact;
  let arr = [];
  console.log(contact);
  console.log(`Sockets Array: ${socketids}`);

  for(let el of socketids){
    if(el.username == contact){
      arr.push(el.socketID);
    }
    else{
    };
  };
  res.json(arr);
});


// ########## START EXPRESS SERVER ##########
http.listen(port, (err) => {
  if(err){
    console.error(err);
  }
  else{
    console.log(`Server listening on http://192.168.2.25:${port}`);
  };
});

