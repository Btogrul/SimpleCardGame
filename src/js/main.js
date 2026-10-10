"use strict";

const all = document.getElementById("a-cards");
const API_URL = "/cards";

// DOM Elements
const p1ScoreVal = document.getElementById("p1-score-val");
const p2ScoreVal = document.getElementById("p2-score-val");
const p2LabelName = document.getElementById("p2-label-name");
const turnBanner = document.getElementById("turn-banner");
const turnText = document.getElementById("turn-text");
const btnModePvp = document.getElementById("btn-mode-pvp");
const btnModeBot = document.getElementById("btn-mode-bot");

const battleModal = document.getElementById("battle-modal");
const battleStatusText = document.getElementById("battle-status-text");
const battleFighters = document.querySelector(".battle-fighters");
const fighter1 = document.getElementById("fighter-1");
const fighter2 = document.getElementById("fighter-2");
const f2PlayerTag = document.getElementById("f2-player-tag");
const f1Img = document.getElementById("f1-img");
const f1Name = document.getElementById("f1-name");
const f1Power = document.getElementById("f1-power");
const f1Badge = document.getElementById("f1-badge");
const f2Img = document.getElementById("f2-img");
const f2Name = document.getElementById("f2-name");
const f2Power = document.getElementById("f2-power");
const f2Badge = document.getElementById("f2-badge");
const battleResultBanner = document.getElementById("battle-result-banner");
const battleWinnerTitle = document.getElementById("battle-winner-title");
const battleWinnerDesc = document.getElementById("battle-winner-desc");

// Game State
let allCardsData = [];
let currentCards = [];
let gameMode = "pvp"; // 'pvp' or 'bot'
let gameState = "WAITING_P1"; // 'WAITING_P1', 'WAITING_P2', 'BATTLING', 'ROUND_OVER'
let player1Card = null;
let player2Card = null;
let scoreP1 = 0;
let scoreP2 = 0;

// Fetch cards from server
async function getCards() {
  try {
    const res = await fetch(API_URL);
    allCardsData = await res.json();
    renderBoard();
  } catch (error) {
    console.error("Error loading cards:", error);
  }
}

// Render cards board
function renderBoard() {
  if (!allCardsData || allCardsData.length === 0) return;
  
  // Clone & shuffle cards
  const pool = [...allCardsData];
  shuffleArray(pool);
  
  // Pick 12 cards and generate unique power values for each
  currentCards = pool.slice(0, 12).map((item, index) => {
    return {
      id: item.id,
      index: index,
      character: item.character,
      imgUrl: item.imgUrl,
      power: Math.floor(Math.random() * (1000 - 150) + 150) // Power between 150 and 1000
    };
  });

  resetRoundState();
  buildCardElements();
}

// Build cards HTML
function buildCardElements() {
  let result = "";
  currentCards.forEach((item, index) => {
    result += `
      <div class="col-6 col-md-4 col-lg-2">
        <div class="flip-card" id="card-${index}" data-index="${index}">
          <div class="card-inner">
            <div class="card-front">
              <img src="${item.imgUrl}" alt="${item.character}">
            </div>
            <div class="card-back">
              <h2>${item.character}</h2>
              <div class="card-power-badge secret-power" id="power-badge-${index}">⚡ ???</div>
              <span class="click-to-choose" id="choose-hint-${index}">🎯 Seçmək üçün klik et</span>
            </div>
          </div>
        </div>
      </div>`;
  });

  all.innerHTML = result;

  // Add click listeners to cards
  document.querySelectorAll(".flip-card").forEach(cardEl => {
    cardEl.addEventListener("click", () => {
      const idx = parseInt(cardEl.getAttribute("data-index"), 10);
      handleCardSelection(idx);
    });
  });
}

// Reveal card power on the board
function revealCardPower(cardIndex, playerTag, badgeClass, powerVal) {
  const cardElement = document.getElementById(`card-${cardIndex}`);
  if (!cardElement) return;

  // Keep card rotated so the power remains visible
  cardElement.classList.add("card-revealed", badgeClass);

  // Update power badge to revealed state
  const powerBadge = document.getElementById(`power-badge-${cardIndex}`);
  if (powerBadge) {
    powerBadge.className = "card-power-badge revealed-power";
    powerBadge.innerHTML = `⚡ ${powerVal}`;
  }

  // Update hint text
  const hintEl = document.getElementById(`choose-hint-${cardIndex}`);
  if (hintEl) {
    hintEl.textContent = `✅ ${playerTag} Seçildi`;
    hintEl.style.background = "rgba(34, 197, 94, 0.25)";
    hintEl.style.color = "#4ade80";
  }

  // Add floating banner on card
  let badgeEl = cardElement.querySelector(".selection-floating-badge");
  if (!badgeEl) {
    badgeEl = document.createElement("div");
    badgeEl.className = "selection-floating-badge";
    cardElement.appendChild(badgeEl);
  }
  badgeEl.innerHTML = `${playerTag}: ⚡ ${powerVal}`;
}

// Handle player card selection
function handleCardSelection(cardIndex) {
  const chosenCard = currentCards[cardIndex];
  if (!chosenCard) return;

  const cardElement = document.getElementById(`card-${cardIndex}`);
  if (!cardElement) return;

  // Step 1: Player 1 Selection
  if (gameState === "WAITING_P1") {
    player1Card = chosenCard;

    // Reveal Player 1 card's power immediately
    revealCardPower(cardIndex, "🔵 P1", "card-selected-p1", chosenCard.power);

    if (gameMode === "bot") {
      gameState = "WAITING_P2";
      turnBanner.className = "turn-banner turn-p2 mt-3";
      turnText.innerHTML = `<strong>🔵 Oyunçu 1</strong> (${chosenCard.character}): <strong>⚡ ${chosenCard.power} Güc</strong> açıldı!<br>🤖 Bot kartını seçir...`;

      // Bot automatically picks another card after a short delay
      setTimeout(() => {
        handleBotSelection(cardIndex);
      }, 900);
    } else {
      // 2-Player (PvP) Mode: Hand over to Player 2
      gameState = "WAITING_P2";
      turnBanner.className = "turn-banner turn-p2 mt-3";
      turnText.innerHTML = `<strong>🔵 Oyunçu 1</strong> (${chosenCard.character}): <strong>⚡ ${chosenCard.power} Güc</strong> açıldı!<br>👉 <strong>🔴 Oyunçu 2</strong>: İndi sən öz kartını seç!`;
    }
    return;
  }

  // Step 2: Player 2 Selection (PvP)
  if (gameState === "WAITING_P2" && gameMode === "pvp") {
    // Prevent picking the same card already chosen by Player 1
    if (player1Card && player1Card.index === cardIndex) {
      alertBanner("Bu kart artıq Oyunçu 1 tərəfindən seçilib! Başqa bir kart seçin.");
      return;
    }

    player2Card = chosenCard;

    // Reveal Player 2 card's power immediately
    revealCardPower(cardIndex, "🔴 P2", "card-selected-p2", chosenCard.power);

    gameState = "BATTLING";
    turnBanner.className = "turn-banner turn-p1 mt-3";
    turnText.innerHTML = `<strong>🔴 Oyunçu 2</strong> (${chosenCard.character}): <strong>⚡ ${chosenCard.power} Güc</strong> açıldı!<br>⚔️ <strong>DÖYÜŞ BAŞLAYIR!</strong>`;

    // Pause briefly so players can see both revealed powers on board before Arena opens
    setTimeout(() => {
      startBattle();
    }, 1100);
  }
}

// Bot selects a random available card
function handleBotSelection(p1Index) {
  const availableIndices = currentCards
    .map((c, i) => i)
    .filter(i => i !== p1Index);

  const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const botCard = currentCards[randomIdx];

  // Reveal Bot card's power on the board
  revealCardPower(randomIdx, "🤖 Bot", "card-selected-p2", botCard.power);

  player2Card = botCard;
  gameState = "BATTLING";
  turnBanner.className = "turn-banner turn-p1 mt-3";
  turnText.innerHTML = `🤖 <strong>Bot</strong> (${botCard.character}): <strong>⚡ ${botCard.power} Güc</strong> açıldı!<br>⚔️ <strong>DÖYÜŞ BAŞLAYIR!</strong>`;

  // Pause briefly so players can see both revealed powers on board
  setTimeout(() => {
    startBattle();
  }, 1100);
}

// Update turn banner UI
function updateTurnBanner(status) {
  turnBanner.className = "turn-banner mt-3";

  if (status === "p1_turn") {
    turnBanner.classList.add("turn-p1");
    turnText.innerHTML = "<strong>🔵 Oyunçu 1</strong>: Öz döyüş kartını seç!";
  } else if (status === "p2_turn") {
    turnBanner.classList.add("turn-p2");
    turnText.innerHTML = "<strong>🔴 Oyunçu 2</strong>: İndi sən öz döyüş kartını seç! (Oyunçu 1 kartını gizli seçdi)";
  } else if (status === "bot_choosing") {
    turnBanner.classList.add("turn-p2");
    turnText.innerHTML = "<strong>🤖 Bot</strong> kartını seçir...";
  } else if (status === "battling") {
    turnBanner.classList.add("turn-p1");
    turnText.innerHTML = "⚔️ <strong>DÖYÜŞ BAŞLAYIR!</strong>";
  }
}

function alertBanner(msg) {
  const original = turnText.innerHTML;
  turnText.innerHTML = `<span style="color:#ff4444">⚠️ ${msg}</span>`;
  setTimeout(() => {
    turnText.innerHTML = original;
  }, 2000);
}

// Battle Arena Flow
function startBattle() {
  if (!player1Card || !player2Card) return;

  // Populate Fighter 1
  f1Img.src = player1Card.imgUrl;
  f1Name.textContent = player1Card.character;
  f1Power.textContent = player1Card.power;

  // Populate Fighter 2
  f2Img.src = player2Card.imgUrl;
  f2Name.textContent = player2Card.character;
  f2Power.textContent = player2Card.power;
  f2PlayerTag.textContent = gameMode === "bot" ? "🤖 Bot" : "🔴 Oyunçu 2";

  // Reset Arena State
  fighter1.className = "fighter-box fighter-p1";
  fighter2.className = "fighter-box fighter-p2";
  f1Badge.className = "result-badge d-none";
  f2Badge.className = "result-badge d-none";
  battleResultBanner.classList.add("d-none");
  battleStatusText.textContent = "⚔️ Kartlar toqquşur! Qalib müəyyən edilir...";

  // Show Modal
  battleModal.classList.remove("d-none");

  // Clash & Shake Animation
  const battleArena = battleModal.querySelector(".battle-arena");
  battleFighters.classList.add("clashing");
  if (battleArena) battleArena.classList.add("arena-shaking");

  // Determine winner after 1.5 seconds of clash shake
  setTimeout(() => {
    battleFighters.classList.remove("clashing");
    if (battleArena) battleArena.classList.remove("arena-shaking");
    resolveBattle();
  }, 1500);
}

// Resolve battle outcome and scores
function resolveBattle() {
  const p1Pow = player1Card.power;
  const p2Pow = player2Card.power;

  f1Badge.classList.remove("d-none");
  f2Badge.classList.remove("d-none");
  battleResultBanner.classList.remove("d-none");

  if (p1Pow > p2Pow) {
    // Player 1 Wins
    scoreP1++;
    fighter1.classList.add("winner-fighter");
    fighter2.classList.add("loser-fighter");

    f1Badge.className = "result-badge win";
    f1Badge.textContent = "🏆 QALİB! (WINNER)";

    f2Badge.className = "result-badge loss";
    f2Badge.textContent = "❌ MƏĞLUB";

    battleStatusText.textContent = "🎉 Döyüş başa çatdı!";
    battleWinnerTitle.textContent = "🏆 QALİB: OYUNÇU 1!";
    battleWinnerTitle.style.color = "#00d2ff";
    battleWinnerDesc.textContent = `Oyunçu 1 (${p1Pow} Güc) > ${p2Pow} Güclə qalib gəldi!`;
  } else if (p2Pow > p1Pow) {
    // Player 2 / Bot Wins
    scoreP2++;
    fighter2.classList.add("winner-fighter");
    fighter1.classList.add("loser-fighter");

    const p2WinnerName = gameMode === "bot" ? "BOT" : "OYUNÇU 2";

    f2Badge.className = "result-badge win";
    f2Badge.textContent = "🏆 QALİB! (WINNER)";

    f1Badge.className = "result-badge loss";
    f1Badge.textContent = "❌ MƏĞLUB";

    battleStatusText.textContent = "🎉 Döyüş başa çatdı!";
    battleWinnerTitle.textContent = `🏆 QALİB: ${p2WinnerName}!`;
    battleWinnerTitle.style.color = "#ff007f";
    battleWinnerDesc.textContent = `${p2WinnerName} (${p2Pow} Güc) > ${p1Pow} Güclə qalib gəldi!`;
  } else {
    // Draw
    fighter1.classList.add("draw-fighter");
    fighter2.classList.add("draw-fighter");

    f1Badge.className = "result-badge draw";
    f1Badge.textContent = "🤝 BƏRABƏRƏ";

    f2Badge.className = "result-badge draw";
    f2Badge.textContent = "🤝 BƏRABƏRƏ";

    battleStatusText.textContent = "🤝 Döyüş heç-heçə bitdi!";
    battleWinnerTitle.textContent = "🤝 BƏRABƏRƏ!";
    battleWinnerTitle.style.color = "#ffd700";
    battleWinnerDesc.textContent = `Hər iki kart bərabər (${p1Pow}) gücə malikdir!`;
  }

  // Update Scoreboard UI
  updateScoreboardUI();
  gameState = "ROUND_OVER";
}

// Update Scoreboard UI
function updateScoreboardUI() {
  p1ScoreVal.textContent = scoreP1;
  p2ScoreVal.textContent = scoreP2;
}

// Close Battle Modal and start next round
function closeBattleAndNextRound() {
  battleModal.classList.add("d-none");
  renderBoard(); // Fresh cards & power values for the new round
}
window.closeBattleAndNextRound = closeBattleAndNextRound;

// Reset round state
function resetRoundState() {
  gameState = "WAITING_P1";
  player1Card = null;
  player2Card = null;
  updateTurnBanner("p1_turn");

  // Remove selection styling from previous cards
  document.querySelectorAll(".flip-card").forEach(el => {
    el.classList.remove("card-selected-p1", "card-selected-p2", "card-disabled");
  });
}

// Reset Scoreboard
function resetScoreboard() {
  scoreP1 = 0;
  scoreP2 = 0;
  updateScoreboardUI();
}
window.resetScoreboard = resetScoreboard;

// Shuffle & Reset Round
function shuffleAndResetRound() {
  renderBoard();
}
window.shuffleAndResetRound = shuffleAndResetRound;

// Switch Game Mode ('pvp' or 'bot')
function setGameMode(mode) {
  gameMode = mode;
  if (mode === "bot") {
    btnModeBot.classList.add("active");
    btnModePvp.classList.remove("active");
    p2LabelName.textContent = "🤖 Bot";
  } else {
    btnModePvp.classList.add("active");
    btnModeBot.classList.remove("active");
    p2LabelName.textContent = "🔴 Oyunçu 2";
  }
  renderBoard();
}
window.setGameMode = setGameMode;

// Utility: Shuffle Array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Initialize
getCards();


