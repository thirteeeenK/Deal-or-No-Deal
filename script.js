const vehicles = [
  { type: "Car", name: "Tesla Model S", value: 80000 },
  { type: "Car", name: "BMW M3", value: 70000 },
  { type: "Car", name: "Mercedes-Benz C-Class", value: 60000 },
  { type: "Car", name: "Audi A4", value: 50000 },
  { type: "Car", name: "Toyota Camry", value: 40000 },
  { type: "Car", name: "Honda Civic", value: 30000 },
  { type: "Bike", name: "Ducati Panigale V4", value: 28000 },
  { type: "Bike", name: "BMW S1000RR", value: 25000 },
  { type: "Bike", name: "Kawasaki Ninja H2", value: 22000 },
  { type: "Bike", name: "Yamaha YZF-R1", value: 20000 },
  { type: "Bike", name: "Honda CBR1000RR", value: 18000 },
  { type: "Bike", name: "Suzuki GSX-R1000", value: 15000 },
];

let gameState = {
  briefcases: [],
  selectedCase: null,
  openedCases: [],
  round: 0,
  roundsUntilOffer: 3,
};

function updateProbabilityDisplay() {
  const probabilityDetails = document.getElementById("probabilityDetails");
  const highestPrize = vehicles[0]; // Tesla Model S

  // Calculate remaining cases that could contain the highest prize
  const totalRemainingCases =
    gameState.briefcases.length - gameState.openedCases.length;
  const isHighestPrizeEliminated = isVehicleEliminated(highestPrize);

  let html = "";
  if (isHighestPrizeEliminated) {
    html = `
                    <p>❌ The ${
                      highestPrize.name
                    } ($${highestPrize.value.toLocaleString()}) has been eliminated.</p>
                    <p>Chance of winning: 0%</p>
                `;
  } else {
    const probability = ((1 / totalRemainingCases) * 100).toFixed(2);
    html = `
                    <p>🎯 Highest prize: ${
                      highestPrize.name
                    } ($${highestPrize.value.toLocaleString()})</p>
                    <p>Remaining cases: ${totalRemainingCases}</p>
                    <p>Chance of winning: ${probability}%</p>
                    <p>💡 Tip: ${getProbabilityTip(probability)}</p>
                `;
  }
  probabilityDetails.innerHTML = html;
}

function getProbabilityTip(probability) {
  if (probability >= 50) return "Great odds! Consider keeping your case!";
  if (probability >= 25)
    return "Decent chance! Think carefully about the banker's offer.";
  if (probability >= 10)
    return "Getting risky! The banker's offer might be appealing.";
  return "Low chances! Consider taking a good banker's offer.";
}

function initializeGame() {
  gameState.briefcases = [...vehicles]
    .sort(() => Math.random() - 0.5)
    .map((vehicle, index) => ({
      number: index + 1,
      vehicle: vehicle,
      isOpened: false,
      isSelected: false,
    }));

  renderBriefcases();
  renderPrizes();
  updateProbabilityDisplay();
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
    element.innerHTML = briefcase.isOpened
      ? `${briefcase.vehicle.name}`
      : `Case ${briefcase.number}`;
    container.appendChild(element);
  });
}

function renderPrizes() {
  const container = document.getElementById("prizes");
  container.innerHTML = "";

  vehicles.forEach((vehicle) => {
    const element = document.createElement("div");
    element.className = `prize ${
      isVehicleEliminated(vehicle) ? "eliminated" : ""
    }`;
    element.innerHTML = `${vehicle.name} ($${vehicle.value.toLocaleString()})`;
    container.appendChild(element);
  });
}

function isVehicleEliminated(vehicle) {
  return gameState.openedCases.some(
    (caseNum) => gameState.briefcases[caseNum - 1].vehicle.name === vehicle.name
  );
}

function handleBriefcaseClick(caseNumber) {
  const briefcase = gameState.briefcases[caseNumber - 1];

  if (briefcase.isOpened || briefcase.isSelected) return;

  if (gameState.selectedCase === null) {
    // First case selection
    briefcase.isSelected = true;
    gameState.selectedCase = caseNumber;
    document.getElementById("gameStatus").innerText = "Select cases to open!";
  } else {
    // Opening other cases
    briefcase.isOpened = true;
    gameState.openedCases.push(caseNumber);
    gameState.roundsUntilOffer--;

    if (gameState.roundsUntilOffer === 0) {
      showBankerOffer();
      gameState.roundsUntilOffer = 3;
    }
  }

  renderBriefcases();
  renderPrizes();
  updateProbabilityDisplay();
}

function showBankerOffer() {
  const remainingVehicles = gameState.briefcases
    .filter((briefcase) => !briefcase.isOpened && !briefcase.isSelected)
    .map((briefcase) => briefcase.vehicle);

  const randomVehicle =
    remainingVehicles[Math.floor(Math.random() * remainingVehicles.length)];

  document.getElementById("bankerOffer").style.display = "block";
  document.getElementById(
    "offerText"
  ).innerHTML = `The banker offers you:<br><strong>${
    randomVehicle.name
  }</strong><br>Value: $${randomVehicle.value.toLocaleString()}`;
}

function acceptDeal() {
  const offerText = document.getElementById("offerText").innerHTML;
  document.getElementById(
    "gameStatus"
  ).innerHTML = `Congratulations! You've won!<br>${offerText}`;
  endGame();
}

function rejectDeal() {
  document.getElementById("bankerOffer").style.display = "none";
  if (gameState.openedCases.length === gameState.briefcases.length - 2) {
    // Final round
    const finalCase = gameState.briefcases.find(
      (briefcase) => !briefcase.isOpened && !briefcase.isSelected
    );
    document.getElementById(
      "gameStatus"
    ).innerHTML = `Game Over! Your case contained:<br>${
      finalCase.vehicle.name
    }<br>Value: $${finalCase.vehicle.value.toLocaleString()}`;
    endGame();
  }
}

function endGame() {
  gameState.briefcases.forEach((briefcase) => {
    briefcase.isOpened = true;
  });
  renderBriefcases();
  updateProbabilityDisplay();
}

function restartGame() {
  gameState = {
    briefcases: [],
    selectedCase: null,
    openedCases: [],
    round: 0,
    roundsUntilOffer: 3,
  };
  document.getElementById("bankerOffer").style.display = "none";
  document.getElementById("gameStatus").innerText =
    "Select your briefcase to start!";
  initializeGame();
}

// Initialize the game when the page loads
initializeGame();
