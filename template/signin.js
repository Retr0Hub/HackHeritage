const WEBSOCKET_URL = 'ws://localhost:8766';
const FRAME_INTERVAL_MS = 500;

const dom = {
    loading: document.getElementById('loading'),
    webcam: document.getElementById('webcam'),
    status: document.getElementById('status'),
    signInBtn: document.getElementById('signInBtn'),
};

let socket = null;
let recognizedUser = null;

async function initialize() {
    dom.loading.style.display = 'block';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        dom.webcam.srcObject = stream;
        await dom.webcam.play();
    } catch (err) {
        console.error("Error accessing webcam:", err);
        dom.status.textContent = "Could not access webcam. Please check permissions.";
        dom.loading.style.display = 'none';
        return;
    }

    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
        console.log("Face recognition WebSocket connection established.");
        dom.loading.style.display = 'none';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        setInterval(() => {
            if (socket.readyState !== WebSocket.OPEN) return;

            canvas.width = dom.webcam.videoWidth;
            canvas.height = dom.webcam.videoHeight;
            context.drawImage(dom.webcam, 0, 0, canvas.width, canvas.height);
            const data = canvas.toDataURL('image/jpeg');
            socket.send(data);
        }, FRAME_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
        const name = event.data;
        if (name === "Unknown") {
            dom.status.textContent = "Unknown user. Please position your face clearly in front of the camera.";
            dom.signInBtn.disabled = true;
            recognizedUser = null;
        } else {
            dom.status.textContent = `Welcome, ${name}!`;
            dom.signInBtn.disabled = false;
            recognizedUser = name;
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        dom.status.textContent = "Error connecting to the face recognition server.";
        dom.loading.style.display = 'none';
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
        dom.status.textContent = "Connection to the server has been lost.";
    };
}

dom.signInBtn.addEventListener('click', () => {
    if (recognizedUser) {
        // You can optionally save the signed-in user to localStorage or sessionStorage
        // sessionStorage.setItem('signedInUser', recognizedUser);
        window.location.href = '/index.html';
    }
});

initialize();
