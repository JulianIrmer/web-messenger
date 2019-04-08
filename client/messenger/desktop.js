const contactArea = document.querySelector('.contact-area');
const contentArea = document.querySelector('.content-area');
const contact = document.querySelectorAll('.contact-li');
const back = document.querySelector('.back');
const back2 = document.querySelector('.back2');
const addContactForm = document.querySelector('.add-contact-form');
const addContactBtn = document.querySelector('.add-contact-btn');
const addContactInput = document.querySelector('.add-contact-input');
const addedHint = document.querySelector('.added-hint');
const contactName = document.querySelector('.contact-name');
const inputForm = document.querySelector('.input-form');
const messageInput = document.querySelector('.message-input');
const messageArea = document.querySelector('.message-area');
const contactUl = document.querySelector('.contact-ul');
const username = document.querySelector('.username');
const chat = document.querySelector('.message-area');
const chatArea = document.querySelector('.chat-area');
const isTyping = document.querySelector('.is-typing');
const logout = document.querySelector('.logout-btn');
const openMenu = document.querySelector('.open-menu');
const menu = document.querySelector('.menu');

// GLOBAL VARIABLES 
// let contactsArr = [];
let currentUser;
let userData;
let contactsData;
let messagesData;

// const IP_LOCAL = 'http://192.168.2.25:5000';

// ############### DATA ###############

// GET AND DISPLAY ALL CONTACTS
window.onload = () => {
  getAllData();
  // askForNotification();
  // Notification.requestPermission().then(function(result) {
  //   console.log(result);
  // });
};

function getAllData() {
  messageInput.innerHTML = '';

  fetch(IP_LOCAL+'/api/data')
    .then((response) => response.json())
    .then((response) => {
      console.log(response);
      currentUser = response[0].name;
      userData = response[0];
      contactsData = response[1];
      messagesData = response[2];
      messagesData.sort((a,b) => a.date - b.date);
      console.log(messagesData);

        // loop through all contacts and add the html elements to the page
        if(contactsData != null &&  contactsData.length > 0){
          for(let el of response[1]){
            appendContact(el);
            updateLastMsg(el.name);
          };
        };
        // document.querySelector('.title').innerText = currentUser;
        })
        .catch((err) => {if(err){console.error(err)}})
};


// ADD A NEW CONTACT
addContactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = addContactInput.value.trim();
  let isValid = false;  
  const contacts = document.querySelectorAll('.p-name');
  console.log(contacts);

  if(contacts.length > 0){
    for(let el of contacts){
      if(el.innerHTML == name){
        isValid = false;
        break;
      }
      else{
        isValid = true;
      };
    };
  }
  else{
    isValid = true;
  };

  if(currentUser == name){
    isValid = false;
  };

  if(isValid == true && name.length > 0){
    const data = {
      name:name,
      acc:currentUser,
      socketRoom: ''
    };

    fetch(IP_LOCAL+'/api/addContact', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type':'application/json'
      },
    })
    .then(response => {return response.json()})
    .then(response => {
        console.log(response);
        if(response){
          addContactForm.classList.add('hidden');
          addContactForm.textContent = '';
          appendContact(response);
          addedHint.classList.remove('hidden');
          setTimeout(() => {addedHint.classList.add('hidden')}, 1500);
        }
        else{        
          addedHint.innerText = 'No user found';
          addedHint.classList.remove('hidden');
          setTimeout(() => {addedHint.classList.add('hidden')}, 1500);
        };
    })
    .catch(err => { if(err){console.log(err)}});
    window.location.reload();
  };
});

// SEND MESSAGE 
inputForm.addEventListener('submit', (event) => {
  const recipient = contactName.innerHTML;
  event.preventDefault();
  if(contactUl.innerHTML != '' && messageInput.value.length > 0){
    const body = messageInput.value;
    const msgID = Math.round(Math.random(100)*100000);

    const data = { 
      msgID: msgID,
      recipient: recipient,
      sender: currentUser,
      isRead: false,
      body : body,
      date: new Date().toISOString()
    };

    // reset the input form 
    messageInput.value = '';
    
    // post data to mongo
    fetch(IP_LOCAL+'/api/send', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type':'application/json'
      },
    })
      .then(response => {return response.json()})
      .then(response => {
        for(let el of response.rooms){
          if((el.member2.includes(recipient) || el.member1.includes(recipient)) && (el.member2.includes(currentUser) || el.member1.includes(currentUser))){
            sendPrivatMsg(el.roomNumber, data);
          };
        };
      })
      .catch(err => console.error(err));
  

    //push outgoing message to local data
    data.isRead = true;
    messagesData.push(data);

    // add new message to the ui
    appendMessage(data);
  };
});

// LOGOUT
logout.addEventListener('click', () => {
  fetch(IP_LOCAL+'/api/logout');
  window.location.replace('/login');
});

// APPEND CONTACTS TO UI
function appendContact(el){
  const li = document.createElement('li');
  li.className = 'contact-li '+el.name;
  li.id = el.name;
  li.setAttribute('date', '0');
  
  // click to activate chat an display the messages
  li.addEventListener('click', () => {
    displayMessages(el.name);
    if(el.isRead == false){
      el.isRead = true;
    };
    inputForm.classList.remove('hidden');
    updateLastMsg(el.name);
    updateMsgStatus(el.name);
  });
  
  // create content for the contact list
  const name = document.createElement('p');
  name.className = 'p-name '+el.name;
  name.innerText = el.name;

  // const pic = document.createElement('p');
  // pic.textContent = 'PICTURE';
  // pic.className = 'p-pic '+el.name;

  const lastmsg = document.createElement('p');
  lastmsg.className = 'p-lastmsg '+el.name;
  lastmsg.id = 'p-lastmsg ' +el.name;
  // lastmsg.innerText = 'New contact added...';

  const date = document.createElement('p');
  date.className = 'p-date '+el.name;
  date.id = 'p-date '+el.name

  const devider = document.createElement('div');
  devider.className = 'devider';

  // add all created elements to the ul
  // li.appendChild(pic);
  li.appendChild(name);
  li.appendChild(lastmsg);
  li.appendChild(date);
  li.appendChild(devider);
  contactUl.appendChild(li);
  updateLastMsg(el.name);
  markUnreadMessages(el.name);
};

// APPEND MESSAGE DIRECTLY TO UI
function appendMessage(data){
  // console.log(data);
  const msgRow = document.createElement('div');
  msgRow.className = 'message-row';
  
  const msgBubble = document.createElement('div');
  msgBubble.className = 'message';
  const msgBody = document.createElement('p');
  msgBody.className = 'message-body';
  msgBody.textContent = data.body;
  msgBubble.appendChild(msgBody);

  const timeStamp = document.createElement('p');
  timeStamp.className = 'message-time-stamp';
  timeStamp.textContent = data.date.substring(11, 16);

  const hook = document.createElement('span');
  hook.className = 'message-hook';
  // hook.textContent = '//';

  
  msgBubble.appendChild(hook);
  msgBubble.appendChild(timeStamp);
  msgRow.appendChild(msgBubble);
  messageArea.appendChild(msgRow);

  if(data.sender == currentUser){
    msgBubble.className = 'message float-right';
  }
  else{
    msgBubble.className = 'message float-left';
  };
  
  msgBubble.appendChild(timeStamp);
  msgRow.appendChild(msgBubble);
  messageArea.appendChild(msgRow);
  updateLastMsg(data.sender);
  scroll2bottom();
};


// SCROLL DOWN TO LAST MESSAGE
function scroll2bottom(){
  document.querySelector('.message-area').scrollTop = document.querySelector('.message-area').scrollHeight;
};


// CREATE HTML ELEMENTS FOR EVERY MESSAGE
function displayMessages(name){
  messageArea.innerHTML = '';
  if(contactsData.length > 0){
    for(let el of messagesData){
      if(name == el.recipient || (currentUser == el.recipient && el.sender == name)){
        appendMessage(el);
      };
    };
    contactName.innerText = name;
    contactName.dataset.name = name;
    // contactArea.classList.add('hidden');
    // contentArea.classList.remove('hidden');
  };
  
  scroll2bottom();
};


// ############### VISUAL ############### 

// show and hide contact-add-input
addContactBtn.addEventListener('click', () => {
  addContactInput.classList.toggle('zero-wdith');
});

function updateLastMsg(active){
  for(let el of messagesData){
    if((el.sender == active && el.recipient == currentUser) || (el.sender == currentUser && el.recipient == active)){
      // update last message. if longer than 15 chars, shorten the preview message
      if(el.body.length >= 15){
        document.getElementById(`p-lastmsg ${active}`).innerText = el.body.substring(0,12)+'...';
      }
      else if(el.body.length < 15){
        document.getElementById(`p-lastmsg ${active}`).innerText = el.body;
      };

      // update time stamp
      document.getElementById(`${active}`).setAttribute('date', el.date);
      document.getElementById(`p-date ${active}`).innerText = el.date.substring(11, 16);
    };   
  };
  markUnreadMessages(active);
  sortList();
};

function markUnreadMessages(active){
  if(active != currentUser){
    for(let el of messagesData){
      if(el.isRead == false && el.sender == active){
        document.getElementById(`p-lastmsg ${active}`).style.fontWeight = 'bold';
      }
      else if(el.isRead == true && el.sender == active){
        document.getElementById(`p-lastmsg ${active}`).style.fontWeight = '100';
      };
    };
  };
};


function updateMsgStatus(sender){
  fetch(IP_LOCAL+'/api/updatemsgstatus/'+sender)
    .then(response => {return response.json()})
    .catch(err => console.error(err));
};

// // go back to contacts on button click and update lastmsg
// back.addEventListener('click', () => {
//   messagesData.forEach((item) => {
//     item.isRead = true;
//   });
//   updateLastMsg(contactName.innerText);
//   updateMsgStatus(contactName.innerText);
//   messageArea.innerHTML = '';
//   contactArea.classList.remove('hidden');
//   contentArea.classList.add('hidden');
// });

// // go back to contacts on button click and update lastmsg
// back2.addEventListener('click', () => {
//   messagesData.forEach((item) => {
//     item.isRead = true;
//   });
//   updateMsgStatus(contactName.innerText);
//   updateLastMsg(contactName.innerText);
//   messageArea.innerHTML = '';
//   contactArea.classList.remove('hidden');
//   contentArea.classList.add('hidden');
// });

// // Move input up when typing
// messageInput.addEventListener('focus', (event) => {
//   messageArea.style.height = '330px';
//   chatArea.scrollTop = chatArea.scrollHeight;
//   scroll2bottom();
// });

// // move input down when finished typing
// messageInput.addEventListener('blur', (event) => {
//   messageArea.style.height = '550px';
// });

// sort contact list after latest message
// Src: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_list_number
function sortList() {
  var list, i, switching, b, shouldSwitch;
  list = document.querySelector('.contact-ul');
  switching = true;
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // start by saying: no switching is done:
    switching = false;
    b = list.getElementsByTagName("LI");
    // Loop through all list-items:
    for (i = 0; i < (b.length - 1); i++) {
      // start by saying there should be no switching:
      shouldSwitch = false;
      /* check if the next item should
      switch place with the current item: */
      if (b[i].getAttribute('date') < b[i + 1].getAttribute('date')) {
        /* if next item is numerically
        lower than current item, mark as a switch
        and break the loop: */
        shouldSwitch = true;
        break;
      };
    };
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark the switch as done: */
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    };
  };
};

// openMenu.addEventListener('click', (e) => {
  
// });

// function askForNotification(){
//   // Let's check if the browser supports notifications
//   if (!("Notification" in window)) {
//     alert("This browser does not support desktop notification");
//   }

//   // Let's check whether notification permissions have already been granted
//   else if (Notification.permission === "granted") {
//     // If it's okay let's create a notification
//     var notification = new Notification("Hi there!");
//   }

//   // Otherwise, we need to ask the user for permission
//   else if (Notification.permission !== "denied") {
//     Notification.requestPermission().then(function (permission) {
//       // If the user accepts, let's create a notification
//       if (permission === "granted") {
//         var notification = new Notification("Hi there!");
//       }
//     });
//   }
// }