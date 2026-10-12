
// ========================================
// 1. ELEMENTOS DA PÁGINA
// ========================================

const timerDisplay = document.getElementById("timer");
const timerMode = document.getElementById("timer-mode");
const sessionInfo = document.getElementById("session-info");

const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

const modeButtons = document.querySelectorAll(".mode-button");

const progressBar = document.getElementById("progress-bar");
const progressTrack = document.getElementById("progress-track");

const completedSessionsDisplay =
  document.getElementById("completed-sessions");

const focusTimeDisplay = document.getElementById("focus-time");
const nextBreakDisplay = document.getElementById("next-break");

const focusDurationInput = document.getElementById("focus-duration");
const shortDurationInput = document.getElementById("short-duration");
const longDurationInput = document.getElementById("long-duration");

const saveSettingsButton = document.getElementById("save-settings");
const settingsStatus = document.getElementById("settings-status");

// ========================================
// 2. CONFIGURAÇÕES E ESTADO
// ========================================

const durations = {
  focus: 25,
  short: 5,
  long: 15
};

const modeDetails = {
  focus: {
    label: "TEMPO DE FOCO",
    title: "Focus Time"
  },
  short: {
    label: "PAUSA CURTA",
    title: "Short Break"
  },
  long: {
    label: "PAUSA LONGA",
    title: "Long Break"
  }
};

let currentMode = "focus";
let remainingSeconds = durations.focus * 60;
let totalSeconds = remainingSeconds;

let timerInterval = null;
let endTime = null;
let isRunning = false;

let completedSessions = 0;
let totalFocusMinutes = 0;

// ========================================
// 3. FORMATAÇÃO DO TEMPO
// ========================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

// ========================================
// 4. ATUALIZAÇÃO DA INTERFACE
// ========================================

function updateDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);

  const elapsedSeconds = totalSeconds - remainingSeconds;

  const progress = totalSeconds > 0
    ? (elapsedSeconds / totalSeconds) * 100
    : 0;

  progressBar.style.width = `${Math.min(progress, 100)}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    String(Math.round(progress))
  );

  timerMode.textContent = modeDetails[currentMode].label;

  document.body.dataset.mode = currentMode;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === currentMode;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (currentMode === "focus") {
    const sessionNumber = (completedSessions % 4) + 1;
    sessionInfo.textContent = `Sessão ${sessionNumber} de 4`;
  } else if (currentMode === "short") {
    sessionInfo.textContent = "Hora de respirar e relaxar";
  } else {
    sessionInfo.textContent = "Uma pausa maior para recarregar";
  }

  startButton.textContent = isRunning
    ? "Ⅱ Pausar"
    : remainingSeconds === 0
      ? "▶ Iniciar próxima sessão"
      : "▶ Iniciar";

  completedSessionsDisplay.textContent = completedSessions;
  focusTimeDisplay.textContent = `${totalFocusMinutes} min`;

  nextBreakDisplay.textContent =
    completedSessions > 0 && completedSessions % 4 === 0
      ? `${durations.long} min`
      : `${durations.short} min`;

  document.title = `${formatTime(remainingSeconds)} | ${modeDetails[currentMode].title}`;
}

// ========================================
// 5. CONTROLE DO TEMPORIZADOR
// ========================================

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  isRunning = false;
  endTime = null;
}

function startTimer() {
  if (isRunning || remainingSeconds <= 0) {
    return;
  }

  isRunning = true;
  endTime = Date.now() + remainingSeconds * 1000;

  timerInterval = setInterval(() => {
    const millisecondsLeft = endTime - Date.now();

    remainingSeconds = Math.max(
      0,
      Math.ceil(millisecondsLeft / 1000)
    );

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      stopTimer();
      updateDisplay();
      completeCurrentMode();
      return;
    }

    updateDisplay();
  }, 200);

  updateDisplay();
}

function pauseTimer() {
  if (!isRunning) {
    return;
  }

  remainingSeconds = Math.max(
    0,
    Math.ceil((endTime - Date.now()) / 1000)
  );

  stopTimer();
  updateDisplay();
}

function resetTimer() {
  stopTimer();

  remainingSeconds = durations[currentMode] * 60;
  totalSeconds = remainingSeconds;

  settingsStatus.textContent = "";

  updateDisplay();
}

// ========================================
// 6. TROCA DE MODO
// ========================================

function setMode(mode) {
  if (!Object.hasOwn(durations, mode)) {
    return;
  }

  stopTimer();

  currentMode = mode;
  remainingSeconds = durations[mode] * 60;
  totalSeconds = remainingSeconds;

  settingsStatus.textContent = "";

  updateDisplay();
}

// ========================================
// 7. CONCLUSÃO DE UMA SESSÃO
// ========================================

function playAlert() {
  // O alerta é gerado pelo próprio navegador.
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.7
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.7);

    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.warn("Não foi possível reproduzir o alerta sonoro.", error);
  }
}

function completeCurrentMode() {
  playAlert();

  if (currentMode === "focus") {
    completedSessions += 1;
    totalFocusMinutes += durations.focus;

    // A cada quatro sessões de foco, recomenda-se
    // uma pausa longa.
    const nextMode = completedSessions % 4 === 0
      ? "long"
      : "short";

    setMode(nextMode);
  } else {
    // Ao terminar uma pausa, retorna ao foco.
    setMode("focus");
  }

  // O próximo modo fica preparado, mas não começa
  // automaticamente.
  updateDisplay();
}

// ========================================
// 8. EVENTOS DOS BOTÕES
// ========================================

startButton.addEventListener("click", () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetButton.addEventListener("click", resetTimer);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

// ========================================
// 9. CONFIGURAÇÕES PERSONALIZADAS
// ========================================

function readDuration(input) {
  const value = Number(input.value);

  if (!Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

saveSettingsButton.addEventListener("click", () => {
  if (isRunning) {
    settingsStatus.textContent =
      "Pause o temporizador antes de alterar as configurações.";
    return;
  }

  const focus = readDuration(focusDurationInput);
  const short = readDuration(shortDurationInput);
  const long = readDuration(longDurationInput);

  if (
    focus === null ||
    short === null ||
    long === null ||
    focus > 120 ||
    short > 30 ||
    long > 60
  ) {
    settingsStatus.textContent =
      "Informe valores válidos dentro dos limites indicados.";

    return;
  }

  durations.focus = focus;
  durations.short = short;
  durations.long = long;

  remainingSeconds = durations[currentMode] * 60;
  totalSeconds = remainingSeconds;

  settingsStatus.textContent =
    "Configurações salvas com sucesso!";

  updateDisplay();
});

// ========================================
// 10. INICIALIZAÇÃO
// ========================================

updateDisplay();
