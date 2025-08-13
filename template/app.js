

let QUESTIONS = [];

async function fetchQuestions() {
  try {
    const response = await fetch('../questionswithpriority.csv');
    const csvData = await response.text();
    const lines = csvData.split('\n').slice(1); // Skip header

    const questions = lines.map(line => {
      const parts = line.split(',');
      if (parts.length < 4) return null; // Skip malformed lines
      const [id, category, question, priority] = parts;
      return { id, category, question, priority: priority ? priority.trim() : '' };
    }).filter(q => q && q.question); // Filter out malformed or empty lines

    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b].priority);

    // Fisher-Yates shuffle to randomize within priorities
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    QUESTIONS = questions.slice(0, 10).map(q => q.question);
  } catch (error) {
    console.error('Error fetching or parsing questions:', error);
    // Fallback to default questions
  }
}


const WEBSOCKET_URL = 'ws://localhost:8765';
const FRAME_INTERVAL_MS = 500;
const REGISTER_DELAY_MS = 5000; // 5 seconds
const NEXT_DELAY_MS = 1000; // delay after detection before moving on

const dom = {
  loading: document.getElementById('loading'),
  webcam: document.getElementById('webcam'),
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
let frameIntervalId = null;
const answers = [];
let socket = null;

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
  setCountdown(`Hold on: starting in ${REGISTER_DELAY_MS / 1000} seconds`);
  speak(question);

  startRegisteringAfterDelay(REGISTER_DELAY_MS);
}

function startRegisteringAfterDelay(delayMs) {
  isRegistering = false;
  clearInterval(countdownTimerId);

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
    }
  }, 200);
}

function handleDetectedGesture(gesture) {
  if (!isRegistering) return;

  isRegistering = false;
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
  isRegistering = false;
  setCountdown('');
  setStatus('All questions completed.');

  const summary = QUESTIONS.map((q, i) => `Q${i + 1}: ${q}
→ ${answers[i] ? answers[i].toUpperCase() : 'NO ANSWER'}`).join('\n\n');
  dom.questionText.textContent = 'Thank you.';
  dom.lastAnswer.textContent = 'Summary ready below.';

  const pre = document.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.fontSize = '1rem';
  pre.textContent = summary;
  dom.questionText.replaceWith(pre);

  if (socket) {
      socket.close();
  }
  if(frameIntervalId) {
      clearInterval(frameIntervalId);
  }
}

function restart() {
  window.location.reload();
}

dom.restartBtn.addEventListener('click', restart);

async function initialize() {
  dom.loading.style.display = 'block';
  await fetchQuestions();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    dom.webcam.srcObject = stream;
    await dom.webcam.play();
  } catch (err) {
    console.error("Error accessing webcam:", err);
    setStatus("Could not access webcam. Please check permissions.");
    dom.loading.style.display = 'none';
    return;
  }

  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log("WebSocket connection established.");
    dom.loading.style.display = 'none';
    showQuestion();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    frameIntervalId = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) return;

      canvas.width = dom.webcam.videoWidth;
      canvas.height = dom.webcam.videoHeight;
      context.drawImage(dom.webcam, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg');
      socket.send(data);
    }, FRAME_INTERVAL_MS);
  };

  socket.onmessage = (event) => {
    const gesture = event.data;
    console.log("Received gesture:", gesture);
    handleDetectedGesture(gesture);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    setStatus("WebSocket connection error.");
    dom.loading.style.display = 'none';
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed.");
    setStatus("Connection to server lost.");
    if(frameIntervalId) {
      clearInterval(frameIntervalId);
  }
  };
}

initialize();
