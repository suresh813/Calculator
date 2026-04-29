const display = document.getElementById("display");
const history = document.getElementById("history");
const keys = document.querySelectorAll(".key");

let currentValue = "0";
let previousValue = null;
let currentOperator = null;
let waitingForNewValue = false;

// settings
let soundOn = true;
let vibrationOn = true;

const soundToggle = document.getElementById("soundToggle");
const vibrationToggle = document.getElementById("vibrationToggle");
const themeToggle = document.getElementById("themeToggle");

let audioCtx;

// display
function updateDisplay() {
  display.textContent = currentValue;

  // Dynamically shrink font size for long numbers
  const len = currentValue.length;
  if (len > 14) {
    display.style.fontSize = "16px";
  } else if (len > 11) {
    display.style.fontSize = "20px";
  } else if (len > 8) {
    display.style.fontSize = "26px";
  } else {
    display.style.fontSize = "32px";
  }

  if (previousValue && currentOperator) {
    const opSymbol = {
      add: "+",
      subtract: "−",
      multiply: "×",
      divide: "÷",
    }[currentOperator];

    history.textContent = previousValue + " " + opSymbol;
  } else {
    history.textContent = "";
  }
}


// FIX 1: AudioContext must be created AND resumed INSIDE the button click
// handler (a real user gesture). On GitHub Pages (HTTPS), browsers block
// audio created outside a gesture — even if initAudio() was called earlier.
function playBeep() {
  if (!soundOn) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const resume = audioCtx.state === "suspended"
      ? audioCtx.resume()
      : Promise.resolve();

    resume.then(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "square";
      osc.frequency.value = 900;
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.07);
    });
  } catch {}
}


// vibration
function vibrate() {
  if (vibrationOn && navigator.vibrate) {
    navigator.vibrate(35);
  }
}


// numbers
function handleDigit(digit) {
  if (waitingForNewValue) {
    currentValue = digit;
    waitingForNewValue = false;
  } else {
    if (currentValue.replace("-", "").replace(".", "").length >= 12) return;
    currentValue = currentValue === "0" ? digit : currentValue + digit;
  }

  updateDisplay();
}


// decimal
function handleDecimal() {
  if (!currentValue.includes(".")) {
    currentValue += ".";
  }

  updateDisplay();
}


// operator pressed
function handleOperator(op) {

  if (previousValue !== null && !waitingForNewValue) {
    performCalculation();
  }

  previousValue = currentValue;
  currentOperator = op;
  waitingForNewValue = true;

  updateDisplay();
}


// calculation
function performCalculation() {

  if (previousValue === null) return;

  const prev = parseFloat(previousValue);
  const curr = parseFloat(currentValue);

  let result = curr;

  switch (currentOperator) {
    case "add":
      result = prev + curr;
      break;

    case "subtract":
      result = prev - curr;
      break;

    case "multiply":
      result = prev * curr;
      break;

    case "divide":
      result = curr === 0 ? "Error" : prev / curr;
      break;
  }

  currentValue = result.toString();
  previousValue = null;
  currentOperator = null;
  waitingForNewValue = false;

  updateDisplay();
}


// scientific
function scientific(action) {

  let value = parseFloat(currentValue);

  switch (action) {

    case "sqrt":
      currentValue = Math.sqrt(value).toString();
      break;

    case "square":
      currentValue = Math.pow(value, 2).toString();
      break;

    case "percent":
      currentValue = (value / 100).toString();
      break;

    case "sin":
      currentValue = Math.sin(value * Math.PI / 180).toString();
      break;

    case "cos":
      currentValue = Math.cos(value * Math.PI / 180).toString();
      break;

    case "tan":
      currentValue = Math.tan(value * Math.PI / 180).toString();
      break;

    case "log":
      currentValue = Math.log10(value).toString();
      break;

    case "pi":
      currentValue = Math.PI.toString();
      break;
  }

  updateDisplay();
}


// backspace
function backspace() {

  if (currentValue.length > 1) {
    currentValue = currentValue.slice(0, -1);
  } else {
    currentValue = "0";
  }

  updateDisplay();
}


// clear entry
function clearEntry() {
  currentValue = "0";
  updateDisplay();
}


// clear all
function clearAll() {
  currentValue = "0";
  previousValue = null;
  currentOperator = null;
  waitingForNewValue = false;
  updateDisplay();
}


// button click
keys.forEach(key => {

  key.addEventListener("click", () => {

    // playBeep() is called first so AudioContext is created inside
    // the click handler — required by browser autoplay policy on HTTPS
    playBeep();
    vibrate();

    const digit = key.dataset.digit;
    const operator = key.dataset.operator;
    const action = key.dataset.action;

    if (digit !== undefined) {
      handleDigit(digit);
    }

    else if (operator) {
      handleOperator(operator);
    }

    else if (action) {

      switch (action) {

        case "decimal":
          handleDecimal();
          break;

        case "equals":
          performCalculation();
          break;

        case "clear-entry":
          clearEntry();
          break;

        case "clear-all":
          clearAll();
          break;

        case "backspace":
          backspace();
          break;

        default:
          scientific(action);
      }
    }
  });
});


// toggles
soundToggle.addEventListener("change", () => {
  soundOn = soundToggle.checked;
});

vibrationToggle.addEventListener("change", () => {
  vibrationOn = vibrationToggle.checked;
});

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("theme-high-contrast", themeToggle.checked);
});

updateDisplay();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
