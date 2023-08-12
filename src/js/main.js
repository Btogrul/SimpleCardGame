"use strick"
const all = document.getElementById("a-cards");
const API_URL = "http://localhost:3000/cards";



async function getCards(){   
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    shuffleArray(data);
    let result = "";
    data.slice(-12).forEach(item => {
      function Z() {
        return Math.floor(Math.random() * (1000-100) + 100);
      }
      result += ` 
        <div class="col-12 col-md-6 col-lg-2">
          <div class="flip-card">
            <div class="card-inner">
              <div class="card-front">
                <img src=${item.imgUrl} alt="">
              </div>
              <div class="card-back">
                <h2>${item.character} <br> ${Z()}</h2>
              </div>
            </div>
          </div>
        </div>`;
    });
    
    all.innerHTML = result;
    document.querySelectorAll('.flip-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('modal');
      });
    });
  } catch (error) {
    console.log(error);
    
  }}



function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


getCards();


// music 

// let mySound = new Audio('./assets/audio/The Weeknd - Save Your Tears (Official Music Video).mp3')
// mySound.play()

// music 


// alert bashladi

const alerted = sessionStorage.getItem('alerted') || '';  
if (alerted != 'yes') 
 {
 alert("To begin, please start the JSON Server. Find the Json folder and open terminal. after type npm start. have a great day! ");
 sessionStorage.setItem('alerted','yes');
}

// ===========================alert bitdi===================================




//refresh buttonu bashladi

function refresh(){
  window.location.reload("Refresh");
}

//............... refresh buttonu bitdi ..........................

