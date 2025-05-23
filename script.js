const moneyAmounts = [
  0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000,
  25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000,
].sort((a, b) => a - b);

let gameState = {
  briefcases: [],
  selectedCase: null,
  openedCases: [],
  round: 0,
  roundsUntilOffer: 5,
  bankerOffers: [],
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount < 1 ? 2 : 0,
  }).format(amount);
}

function updateProbabilityDisplay() {
  const probabilityDetails = document.getElementById("probabilityDetails");
  const highestPrize = moneyAmounts[moneyAmounts.length - 1];

  // Calculate remaining cases that could contain the highest prize
  const totalRemainingCases =
    gameState.briefcases.length - gameState.openedCases.length;
  const isHighestPrizeEliminated = isAmountEliminated(highestPrize);

  let html = "";
  if (isHighestPrizeEliminated) {
    html = `
      <p>❌ ${formatMoney(highestPrize)} has been eliminated.</p>
      <p>Chance of winning top prize: 0%</p>
    `;
  } else {
    const probability = ((1 / totalRemainingCases) * 100).toFixed(2);
    html = `
      <p>🎯 Top prize: ${formatMoney(highestPrize)}</p>
      <p>Remaining cases: ${totalRemainingCases}</p>
      <p>Chance of winning top prize: ${probability}%</p>
      <p>💡 Tip: ${getProbabilityTip(probability)}</p>
    `;
  }

  // Add banker offer history if any
  if (gameState.bankerOffers.length > 0) {
    html += `<div class="offer-history"><p>Banker Offers:</p><ul>`;
    gameState.bankerOffers.forEach((offer) => {
      html += `<li>${formatMoney(offer)}</li>`;
    });
    html += `</ul></div>`;
  }

  probabilityDetails.innerHTML = html;
}

function getProbabilityTip(probability) {
  if (probability >= 50) return "Excellent odds! Consider holding out!";
  if (probability >= 25) return "Good chance! Think carefully about the offer.";
  if (probability >= 10) return "Getting risky! The offer might be appealing.";
  return "Low chance! Strongly consider taking the offer.";
}

function initializeGame() {
  gameState = {
    briefcases: [],
    selectedCase: null,
    openedCases: [],
    round: 0,
    roundsUntilOffer: 5,
    bankerOffers: [],
  };

  // Create briefcases with shuffled money amounts
  const shuffledAmounts = [...moneyAmounts].sort(() => Math.random() - 0.5);
  gameState.briefcases = shuffledAmounts.map((amount, index) => ({
    number: index + 1,
    amount: amount,
    isOpened: false,
    isSelected: false,
  }));

  renderBriefcases();
  renderPrizes();
  updateProbabilityDisplay();
  document.getElementById("gameStatus").innerText =
    "Select your briefcase to start!";
  document.getElementById("bankerOffer").style.display = "none";
}

function renderBriefcases() {
  const container = document.getElementById("briefcases");
  container.innerHTML = "";

  gameState.briefcases.forEach((briefcase) => {
    const element = document.createElement("div");
    element.className = `briefcase ${briefcase.isOpened ? "opened" : ""} ${
      briefcase.isSelected ? "selected" : ""
    }`;
    element.onclick = () => handleBriefcaseClick(briefcase.number);

    if (briefcase.isOpened) {
      element.innerHTML = `<span class="money">${formatMoney(
        briefcase.amount
      )}</span>`;
    } else {
      element.innerHTML = `Case ${briefcase.number}`;
    }

    container.appendChild(element);
  });
}

function renderPrizes() {
  const container = document.getElementById("prizes");
  container.innerHTML = "";

  // Group amounts into low, medium, high for better display
  const lowTier = moneyAmounts.slice(0, 9);
  const mediumTier = moneyAmounts.slice(9, 18);
  const highTier = moneyAmounts.slice(18);

  // Highlight the current highest remaining amount
  const remainingAmounts = moneyAmounts.filter(
    (amount) => !isAmountEliminated(amount)
  );
  const currentHighest =
    remainingAmounts.length > 0
      ? remainingAmounts[remainingAmounts.length - 1]
      : null;

  const createPrizeElements = (amounts) => {
    amounts.forEach((amount) => {
      const element = document.createElement("div");
      const isEliminated = isAmountEliminated(amount);
      element.className = `prize ${isEliminated ? "eliminated" : ""} ${
        amount === currentHighest ? "highlight" : ""
      }`;
      element.innerHTML = formatMoney(amount);
      container.appendChild(element);
    });
  };

  createPrizeElements([...highTier].reverse());
  createPrizeElements([...mediumTier].reverse());
  createPrizeElements([...lowTier].reverse());
}

function isAmountEliminated(amount) {
  return gameState.openedCases.some(
    (caseNum) => gameState.briefcases[caseNum - 1].amount === amount
  );
}

function handleBriefcaseClick(caseNumber) {
  const briefcase = gameState.briefcases[caseNumber - 1];

  if (briefcase.isOpened || briefcase.isSelected) return;

  if (gameState.selectedCase === null) {
    // First case selection
    briefcase.isSelected = true;
    gameState.selectedCase = caseNumber;
    document.getElementById(
      "gameStatus"
    ).innerText = `You selected Case ${caseNumber}! Now open other cases.`;
  } else {
    // Opening other cases
    briefcase.isOpened = true;
    gameState.openedCases.push(caseNumber);
    gameState.roundsUntilOffer--;

    document.getElementById(
      "gameStatus"
    ).innerHTML = `You opened Case ${caseNumber} and found <strong>${formatMoney(
      briefcase.amount
    )}</strong>!`;

    if (gameState.roundsUntilOffer === 0) {
      showBankerOffer();
      gameState.roundsUntilOffer = Math.max(
        3,
        6 - Math.floor(gameState.openedCases.length / 5)
      );
    }
  }

  renderBriefcases();
  renderPrizes();
  updateProbabilityDisplay();
}

function calculateBankerOffer() {
  const selectedCase = gameState.briefcases.find(
    (c) => c.number === gameState.selectedCase
  );
  const remainingCases = gameState.briefcases.filter(
    (briefcase) => !briefcase.isOpened && !briefcase.isSelected
  );

  const remainingAmounts = remainingCases.map((c) => c.amount);
  const average =
    remainingAmounts.reduce((a, b) => a + b, 0) / remainingAmounts.length;

  // Banker algorithm - becomes more generous as game progresses
  const roundFactor = gameState.openedCases.length / moneyAmounts.length;
  const offer = average * (0.3 + roundFactor * 0.7);

  // Round to nearest appropriate value
  if (offer < 100) return Math.round(offer / 5) * 5;
  if (offer < 1000) return Math.round(offer / 10) * 10;
  if (offer < 10000) return Math.round(offer / 100) * 100;
  return Math.round(offer / 1000) * 1000;
}

function showBankerOffer() {
  const offer = calculateBankerOffer();
  gameState.bankerOffers.push(offer);

  document.getElementById("bankerOffer").style.display = "block";
  document.getElementById("offerText").innerHTML = formatMoney(offer);

  // Scroll to offer for better visibility
  document.getElementById("bankerOffer").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function acceptDeal() {
  const offer = gameState.bankerOffers[gameState.bankerOffers.length - 1];
  const selectedCase = gameState.briefcases.find(
    (c) => c.number === gameState.selectedCase
  );

  document.getElementById("gameStatus").innerHTML = `
    <p>Congratulations! You accepted the deal for:</p>
    <p class="big-win">${formatMoney(offer)}</p>
    <p>Your case had ${formatMoney(selectedCase.amount)}</p>
  `;

  endGame();
  createMoneyRain();
}

function rejectDeal() {
  document.getElementById("bankerOffer").style.display = "none";

  if (gameState.openedCases.length === gameState.briefcases.length - 2) {
    // Final round - only selected case and one other remain
    const finalCase = gameState.briefcases.find(
      (briefcase) => !briefcase.isOpened && !briefcase.isSelected
    );
    const selectedCase = gameState.briefcases.find(
      (c) => c.number === gameState.selectedCase
    );

    const youWon = selectedCase.amount > finalCase.amount;
    const message = youWon
      ? `You WON! Your case had more money!`
      : `The other case had more money!`;

    document.getElementById("gameStatus").innerHTML = `
      <p>${message}</p>
      <p>Your case: ${formatMoney(selectedCase.amount)}</p>
      <p>Other case: ${formatMoney(finalCase.amount)}</p>
      <p class="big-win">${formatMoney(
        Math.max(selectedCase.amount, finalCase.amount)
      )}</p>
    `;

    endGame();
    if (youWon) createMoneyRain();
  } else {
    document.getElementById("gameStatus").innerText =
      "No deal! Continue opening cases.";
  }
}

function endGame() {
  gameState.briefcases.forEach((briefcase) => {
    briefcase.isOpened = true;
  });
  renderBriefcases();
  updateProbabilityDisplay();
}

function createMoneyRain() {
  const container = document.querySelector(".game-container");
  const moneySymbols = ["💰", "💵", "💴", "💶", "💷", "💸"];

  for (let i = 0; i < 30; i++) {
    const money = document.createElement("div");
    money.className = "money-rain";
    money.innerHTML =
      moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
    money.style.left = `${Math.random() * 100}%`;
    money.style.animationDuration = `${2 + Math.random() * 3}s`;
    money.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(money);

    // Remove after animation completes
    setTimeout(() => {
      money.remove();
    }, 5000);
  }
}

function restartGame() {
  // Clear any existing money rain
  document.querySelectorAll(".money-rain").forEach((el) => el.remove());
  initializeGame();
}

// ... (your existing JavaScript code above) ...

function createMoneyRain() {
  const container = document.querySelector(".game-container");
  const moneySymbols = ["💰", "💵", "💴", "💶", "💷", "💸"];

  for (let i = 0; i < 30; i++) {
    const money = document.createElement("div");
    money.className = "money-rain"; // Ensure this class is styled in CSS
    money.innerHTML =
      moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
    money.style.left = `${Math.random() * 100}%`;
    // JS will set animationDuration and animationDelay directly now
    // money.style.animationDuration = `${2 + Math.random() * 3}s`;
    // money.style.animationDelay = `${Math.random() * 2}s`;

    // For .money-rain to use keyframes defined in CSS properly:
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 2;
    money.style.animationDuration = `${duration}s`;
    money.style.animationDelay = `${delay}s`;

    container.appendChild(money);

    // Remove after animation completes
    setTimeout(() => {
      money.remove();
    }, (duration + delay + 0.5) * 1000); // Adjusted timeout
  }
}

// NEW: Function to create confetti effect
function createConfettiEffect() {
  const container = document.querySelector(".game-container");
  const confettiSymbols = ["🎉", "🎊", "✨", "🥳", "🎈", "⭐"];
  const colors = [
    "var(--primary)",
    "var(--secondary)",
    "var(--accent)",
    "var(--success)",
    "var(--info)",
    "var(--money)",
    "var(--highlight)",
    "var(--light)",
  ];

  for (let i = 0; i < 100; i++) {
    // More particles for a festive confetti effect
    const confetti = document.createElement("div");
    confetti.className = "confetti-piece";
    confetti.innerHTML =
      confettiSymbols[Math.floor(Math.random() * confettiSymbols.length)];
    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${Math.random() * -50 - 50}px`; // Start above the container
    confetti.style.fontSize = `${1 + Math.random() * 1.5}rem`;

    // Set random rotation values for the animation
    confetti.style.setProperty(
      "--random-rotate-x",
      `${Math.random() * 720 - 360}deg`
    );
    confetti.style.setProperty(
      "--random-rotate-y",
      `${Math.random() * 720 - 360}deg`
    );
    confetti.style.setProperty(
      "--random-rotate-z",
      `${Math.random() * 720 - 360}deg`
    );

    const duration = 3 + Math.random() * 4; // Duration of fall
    const delay = Math.random() * 1.5; // Delay before starting
    confetti.style.animationDuration = `${duration}s`;
    confetti.style.animationDelay = `${delay}s`;

    container.appendChild(confetti);

    // Remove confetti element after animation + buffer
    setTimeout(() => {
      confetti.remove();
    }, (duration + delay + 0.5) * 1000); // Ensure it's removed after animation completes
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount < 1 ? 2 : 0,
  }).format(amount);
}

// ... (other functions like updateProbabilityDisplay, initializeGame, etc.)

function createMoneyRain() {
  const container = document.querySelector(".game-container");
  if (!container) return; // Safety check
  const moneySymbols = ["💰", "💵", "💴", "💶", "💷", "💸"];

  for (let i = 0; i < 30; i++) {
    const money = document.createElement("div");
    money.className = "money-rain";
    money.innerHTML =
      moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
    money.style.left = `${Math.random() * 100}%`; // Relative to game-container width

    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 2;
    money.style.animationDuration = `${duration}s`;
    money.style.animationDelay = `${delay}s`;
    // Note: The moneyRain keyframe uses translateY(100vh),
    // so it will fall "through" the game-container and be clipped by its overflow:hidden.
    // This is likely fine for the money effect within the box.
    container.appendChild(money);

    setTimeout(() => {
      money.remove();
    }, (duration + delay + 0.5) * 1000);
  }
}

// UPDATED: Function to create confetti effect - now appends to body
function createConfettiEffect() {
  const container = document.body; // <--- KEY CHANGE: Append to document.body
  const confettiSymbols = ["🎉", "🎊", "✨", "🥳", "🎈", "⭐"];
  const colors = [
    "var(--primary)",
    "var(--secondary)",
    "var(--accent)",
    "var(--success)",
    "var(--info)",
    "var(--money)",
    "var(--highlight)",
    "var(--light)",
  ];

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-piece"; // CSS will handle position: absolute relative to viewport
    confetti.innerHTML =
      confettiSymbols[Math.floor(Math.random() * confettiSymbols.length)];
    confetti.style.color = colors[Math.floor(Math.random() * colors.length)];

    // Position across the viewport width, starting above it
    confetti.style.left = `${Math.random() * 100}vw`; // Use vw for viewport width
    confetti.style.top = `${-20 - Math.random() * 50}px`; // Start above the viewport

    confetti.style.fontSize = `${1 + Math.random() * 1.5}rem`;

    // Set random rotation values for the animation (used by fallAndSpin keyframes)
    confetti.style.setProperty(
      "--random-rotate-x",
      `${Math.random() * 720 - 360}deg`
    );
    confetti.style.setProperty(
      "--random-rotate-y",
      `${Math.random() * 720 - 360}deg`
    );
    confetti.style.setProperty(
      "--random-rotate-z",
      `${Math.random() * 720 - 360}deg`
    );

    const duration = 3 + Math.random() * 4; // Duration of fall
    const delay = Math.random() * 1.5; // Delay before starting
    confetti.style.animationDuration = `${duration}s`;
    confetti.style.animationDelay = `${delay}s`;

    container.appendChild(confetti);

    // Remove confetti element after animation + buffer
    setTimeout(() => {
      confetti.remove();
    }, (duration + delay + 0.5) * 1000);
  }
}

function acceptDeal() {
  const offer = gameState.bankerOffers[gameState.bankerOffers.length - 1];
  const selectedCase = gameState.briefcases.find(
    (c) => c.number === gameState.selectedCase
  );

  document.getElementById("gameStatus").innerHTML = `
    <p>Congratulations! You accepted the deal for:</p>
    <p class="big-win">${formatMoney(offer)}</p>
    <p>Your case had ${formatMoney(selectedCase.amount)}</p>
  `;

  endGame();
  createMoneyRain(); // This will be contained within .game-container
  createConfettiEffect(); // This will now be full screen
}

function rejectDeal() {
  document.getElementById("bankerOffer").style.display = "none";

  if (gameState.openedCases.length === gameState.briefcases.length - 2) {
    const finalCase = gameState.briefcases.find(
      (briefcase) => !briefcase.isOpened && !briefcase.isSelected
    );
    const selectedCase = gameState.briefcases.find(
      (c) => c.number === gameState.selectedCase
    );

    const youWon = selectedCase.amount > finalCase.amount;
    const message = youWon
      ? `You WON! Your case had more money!`
      : `The other case had more money!`;

    document.getElementById("gameStatus").innerHTML = `
      <p>${message}</p>
      <p>Your case: ${formatMoney(selectedCase.amount)}</p>
      <p>Other case: ${formatMoney(finalCase.amount)}</p>
      <p class="big-win">${formatMoney(
        Math.max(selectedCase.amount, finalCase.amount)
      )}</p>
    `;

    endGame();
    if (youWon) {
      createMoneyRain(); // Contained
      createConfettiEffect(); // Full screen
    }
  } else {
    document.getElementById("gameStatus").innerText =
      "No deal! Continue opening cases.";
  }
}

function restartGame() {
  // Clear any existing money rain (which are children of .game-container)
  document
    .querySelectorAll(".game-container .money-rain")
    .forEach((el) => el.remove());
  // Clear any existing confetti (which are children of body)
  document
    .querySelectorAll("body > .confetti-piece")
    .forEach((el) => el.remove());
  initializeGame();
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", initializeGame);
