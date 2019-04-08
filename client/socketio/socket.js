// document.onload = () => {
  const IP_LOCAL = 'http://192.168.2.25:5000';
  const socket = io(IP_LOCAL);

  // document.querySelector('.is-typing').classList.add('hidden');
  // document.querySelector('.online-status').classList.add('hidden');


  socket.on('connect', () => {
    sendSocketData(socket.id);
    joinAllRooms();
    console.log('socket connected...');
  
    // receive pm
    socket.on('private message', (data) => {
      data.isRead = false;
      // push incoming messge to local data
      messagesData.push(data);
      
      // add received message to the ui
      appendMessage(data);
      sortList();
    });
  
    // receive typing status
    socket.on('typing...', (data) => {
      if(data.sender == contactName.innerHTML){
        if(data.status == 'typing'){
          document.querySelector('.is-typing').classList.remove('hidden');
          document.querySelector('.online-status').classList.add('hidden');
        };
      };
      setTimeout(() => {
        document.querySelector('.is-typing').classList.add('hidden');
          document.querySelector('.online-status').classList.remove('hidden');
      }, 500)
    });
    
    
    // receive online status
    socket.on('online status...', (data) => {
      console.log(data.status);
      if(data.sender == contactName.innerHTML){
        if(data.status == 'online'){
          document.querySelector('.online-status').classList.remove('hidden');
        };
        if(data.status == 'offline'){
          document.querySelector('.online-status').classList.add('hidden');
        };
      };
    });
  });


// document.querySelector('.is-typing').classList.add('hidden');

function sendSocketData(socketID){
  const data = {
    socketID : socketID,
    username: currentUser
  };

  fetch(IP_LOCAL+'/api/socketdata', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'content-type':'application/json'
    },
  })
  .then(response => {return response.json()})
  .catch(err => console.error(err));
};

function getSocketData(contact){
  let result = '';
  fetch(IP_LOCAL+'/api/getSocketID/'+contact)
    .then(response => {return response.json()})
    .then(response => result = response.socketID)
    .catch(err => console.log(err));
    return result;
};

function sendPrivatMsg(roomNumber, data){
  socket.emit('send message', {
    msgID: data.msgID,
    room: roomNumber,
    body: data.body,
    sender: data.sender,
    recipient: data.recipient,
    date: data.date
    // isRead: data.isRead
  });
};

function joinAllRooms(){
  fetch(IP_LOCAL+'/api/data')
  .then(response => {
      return response.json()
  })
  .then(response => {

      for(let el of response[0].rooms){
        socket.emit('subscribe', el.roomNumber);
    };
  })
  .catch(err => console.error(err));
};


// SHOW IF USER IS TYPING

document.querySelector('.message-input').addEventListener('focus', (event) => {
  let i = 0;
  const activeChat = contactName.innerHTML;
  fetch(IP_LOCAL+'/api/data')
  .then(response => {return response.json()})
  .then(response => {
    for(let el of response[0].rooms){
      if((el.member2.includes(activeChat) || el.member1.includes(activeChat)) && (el.member1.includes(currentUser) || el.member2.includes(currentUser))){
        roomNumber = el.roomNumber;
        document.querySelector('.message-input').addEventListener('keyup', (event) => {
          const data = {
            status: 'typing',
            room: roomNumber,
            sender: currentUser
          };

          data.status = 'typing';
          // send status on every 20th keyup
          if(i % 2 == 0){
            socket.emit('typing', data);
          }
          i++;
        });
      };
    };
  })
  .catch(err => console.error(err));
});


document.onload = () => { 
  const data = { 
    sender: currentUser,
    status: ''
  };

  window.addEventListener('focus', () => {
    data.status = 'online';
    socket.emit('online status', data);
  });

  window.addEventListener('blur', () => {
    data.status = 'offline';
    socket.emit('online status', data);
  });
};