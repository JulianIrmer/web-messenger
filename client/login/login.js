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


// global variables
let nameCache = [];
let pwCheck = false;
let isNameValid = false;
let isEmailValid = false;
let loggedInName = '';
// ###################################################################

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
  event.preventDefault();
  // get data from input
  const name = document.querySelector('.register-name').value;
  const email = document.querySelector('.register-email').value;
  const password1 = document.querySelector('.register-password1').value;
  const password2 = document.querySelector('.register-password2').value;


  if (password1 != password2) {
    pwHintRegister.classList.remove('hidden');
    setTimeout(() => {
      pwHintRegister.classList.add('hidden');
    }, 2000);
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

  if(pwCheck == true && name.length > 0 && email.length > 6){
    // make post request to api and send the user data
    fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    })
    .then((response) => {return response.json()})
    .then((response) => {
      if(response.message == 'success'){
        nameHintRegister.classList.remove('hidden');
        nameHintRegister.style.backgroundColor = 'green';
        nameHintRegister.innerText = 'Registered!'
        setTimeout(() => {
          nameHintRegister.classList.add('hidden');
        }, 2000);

        console.log('User registered');
        window.location.replace('/mobile/');
      }
      else if(response.email == false){
        nameHintRegister.classList.remove('hidden');
        nameHintRegister.innerText = 'Email already in use.';
        console.log('Email already in use');
        setTimeout(() => {
          nameHintRegister.classList.add('hidden');
        }, 2000);
      }
      else if(response.name == false){
        nameHintRegister.classList.remove('hidden');
        nameHintRegister.innerText = 'Name already in use.'
        console.log('Name already in use');
        setTimeout(() => {
          nameHintRegister.classList.add('hidden');
        }, 2000);
      };
    })
    .catch((err) =>{if(err){console.log(err)}});
  };
});

// LOGIN REQUEST
loginBtn.addEventListener('click', (event) => {
event.preventDefault();

const name = document.querySelector('.login-name').value;
const password = document.querySelector('.login-password').value;
const screenWidth = window.innerWidth;

const data = {
  name,
  password
};

fetch('/api/login', {
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
      if(screenWidth > 900){
        window.location.replace('/messenger/');
      }
      else{
        window.location.replace('/mobile/');
      };
    }
    else{
      nameHintRegister.classList.remove('hidden');
      nameHintRegister.innerText = 'No user with this name exists or the entered password is wrong.'
      setTimeout(() => {
        nameHintRegister.classList.add('hidden');
      }, 3000);
    };
  })
  .catch((err) => console.error(err));
});
