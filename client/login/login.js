// DOM 
const loginBtn = document.querySelector('.login-btn');
const loginForm = document.querySelector('.login');
const loginName = document.querySelector('.name');
const registerForm = document.querySelector('.register');
const registerBtn = document.querySelector('.register-btn');
const show = document.querySelector('.show');
const pwHintRegister = document.querySelector('.pwHintRegister');
const nameHintRegister = document.querySelector('.nameHintRegister');
const pwHintLogin = document.querySelector('.pwHintLogin');
const nameHintLogin = document.querySelector('.nameHintLogin');
const container = document.querySelector('.container');
const container2 = document.querySelector('.container2');
const msgWrapper = document.querySelector('.messenger-wrapper');
const loginWrapper = document.querySelector('.login-wrapper');
// ###################################################################


// API URLs
const URL_REGISTER = 'http://localhost:5000/api/register';
const IP_LOCAL = 'http://192.168.2.25:5000';

// ###################################################################


// global variables
let nameCache = [];
let pwCheck = false;
let isNameValid = false;
let isEmailValid = false;
let loggedInName = '';
// ###################################################################

// Load the background
// particlesJS.load('particles-js', 'particles.js-master/particlesjs.json', function () {
//   console.log('callback - particles.js config loaded');
// });

checkCookie();

function checkCookie(){
  if(document.cookie.length > 0){
    loginName.value = document.cookie;
  }
}

// switch between login and registration
show.addEventListener('click', () => {
  document.querySelector('.container2').classList.toggle('hidden');
  document.querySelector('.container').classList.toggle('hidden');

  if (show.innerHTML === 'Register') {
    show.innerHTML = 'Login';
  } else {
    show.innerHTML = 'Register';
  };
});

// REGISTRATION REQUEST
registerBtn.addEventListener('click', (event) => {
  
  // get data from input
  event.preventDefault();
  const formData = new FormData(registerForm);
  let name = formData.get('name');
  const email = formData.get('email');
  const password1 = formData.get('password1');
  const password2 = formData.get('password2');

  if (password1 != password2) {
    pwHintRegister.classList.remove('hidden');
    pwCheck = false;
  } else {
    pwCheck = true;
    pwHintRegister.classList.add('hidden');
  };

  const data = {
    name,
    email,
    password1,
  };

  if(pwCheck == true){
    // make post request to api and send the user data
    fetch(IP_LOCAL+'/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    })
    .then((response) => {return response.json()})
    .then((response) => {
      if(response.message == 'success'){
        nameHintRegister.classList.add('hidden');
        console.log('User registered');
        window.location.replace('/mobile/');
      }
      else if(response.email == false){
        nameHintRegister.classList.remove('hidden');
        nameHintRegister.innerText = 'Email already in use.';
        console.log('Email already in use');
      }
      else if(response.name == false){
        nameHintRegister.classList.remove('hidden');
        nameHintRegister.innerText = 'Name already in use.'
        console.log('Name already in use');
      };
    })
    .catch((err) =>{if(err){console.log(err)}});
  };
});

// LOGIN REQUEST
loginBtn.addEventListener('click', (event) => {
event.preventDefault();
const formData = new FormData(loginForm);
const name = formData.get('loginName');
const password = formData.get('loginPassword');
const screenWidth = window.innerWidth;

const data = {
  name,
  password
};

fetch(IP_LOCAL+'/api/login', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: {
    'content-type':'application/json'
  },
})
  .then((response) => {
    return response.json();
  })
  .then(response => {
    console.log(response);
    if(response.isLoggedIn == true){
      if(screenWidth < 900){
        window.location.replace('/messenger');
      }
      else{
        window.location.replace('/mobile/');
      };
    };
  })
  .catch((err) => console.error(err));
});
