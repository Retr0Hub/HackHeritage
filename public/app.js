const QUESTIONS = [
  "Are you experiencing pain right now?",
  "Do you need assistance with drinking water?",
  "Are you feeling dizzy?",
  "Do you want to rest?",
  "Do you feel safe?",
  "Do you need to call a caregiver?",
  "Are you comfortable with the current temperature?",
  "Do you need medication now?",
  "Are you having trouble breathing?",
  "Do you want to continue?"
];

const API_BASE = '';
const POLL_INTERVAL_MS = 400;
const REGISTER_DELAY_MS = 5000; // 5 seconds
const NEXT_DELAY_MS = 1000; // delay after detection before moving on

const dom = {
  questionText: document.getElementById('questionText'),
  countdown: document.getElementById('countdown'),
  status: document.getElementById('status'),
  progressText: document.getElementById('progressText'),
  lastAnswer: document.getElementById('lastAnswer'),
  restartBtn: document.getElementById('restartBtn'),
};

let currentIndex = 0;
let isRegistering = false;
let countdownTimerId = null;
let pollIntervalId = null;
const answers = [];

function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    synth.cancel();
    synth.speak(utter);
  } catch (_) {
    // best effort
  }
}

function updateProgress() {
  dom.progressText.textContent = `Question ${Math.min(currentIndex + 1, QUESTIONS.length)} of ${QUESTIONS.length}`;
}

function setStatus(text) {
  dom.status.textContent = text;
}

function setCountdown(text) {
  dom.countdown.textContent = text;
}

function showQuestion() {
  const question = QUESTIONS[currentIndex];
  dom.questionText.textContent = question;
  updateProgress();
  setStatus('Preparing to listen for gesture…');
  setCountdown('Hold on: starting in 5 seconds');
  speak(question);

  // Start 5-second delay before registering gestures
  startRegisteringAfterDelay(REGISTER_DELAY_MS);
}

function startRegisteringAfterDelay(delayMs) {
  isRegistering = false;
  clearInterval(countdownTimerId);
  clearInterval(pollIntervalId);

  const startAt = Date.now();
  const endAt = startAt + delayMs;
  countdownTimerId = setInterval(() => {
    const remainingMs = Math.max(0, endAt - Date.now());
    const seconds = Math.ceil(remainingMs / 1000);
    setCountdown(`Listening starts in ${seconds}s…`);
    if (remainingMs <= 0) {
      clearInterval(countdownTimerId);
      setCountdown('Listening for gesture…');
      isRegistering = true;
      startPollingGesture();
    }
  }, 200);
}

function startPollingGesture() {
  clearInterval(pollIntervalId);
  setStatus('Listening… Please perform YES or NO gesture');

  pollIntervalId = setInterval(async () => {
    if (!isRegistering) return;
    try {
      const res = await fetch(`${API_BASE}/api/gesture`, { method: 'GET', cache: 'no-cache' });
      const data = await res.json();
      if (data && data.detected && (data.gesture === 'yes' || data.gesture === 'no')) {
        handleDetectedGesture(data.gesture);
      }
    } catch (err) {
      // On errors, keep trying but surface a status once
      setStatus('Connection issue. Retrying…');
    }
  }, POLL_INTERVAL_MS);
}

function handleDetectedGesture(gesture) {
  isRegistering = false;
  clearInterval(pollIntervalId);
  setCountdown('');

  const answerText = gesture.toUpperCase();
  answers[currentIndex] = gesture;
  dom.lastAnswer.textContent = `Answer: ${answerText}`;
  setStatus(`Detected ${answerText}.`);
  speak(`Detected ${answerText}`);

  setTimeout(() => {
    goToNextQuestion();
  }, NEXT_DELAY_MS);
}

function goToNextQuestion() {
  currentIndex += 1;
  if (currentIndex >= QUESTIONS.length) {
    onComplete();
    return;
  }
  showQuestion();
}

function onComplete() {
  clearInterval(countdownTimerId);
  clearInterval(pollIntervalId);
  isRegistering = false;
  setCountdown('');
  setStatus('All questions completed.');

  const summary = QUESTIONS.map((q, i) => `Q${i + 1}: ${q}\n→ ${answers[i] ? answers[i].toUpperCase() : 'NO ANSWER'}`).join('\n\n');
  dom.questionText.textContent = 'Thank you.';
  dom.lastAnswer.textContent = 'Summary ready below.';

  // Render summary in a readable block
  const pre = document.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.fontSize = '1rem';
  pre.textContent = summary;
  dom.questionText.replaceWith(pre);
}

function restart() {
  // Reload to reset DOM to initial state
  window.location.reload();
}

dom.restartBtn.addEventListener('click', restart);

// Start immediately with first question
showQuestion();