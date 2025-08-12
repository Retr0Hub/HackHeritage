# Gesture-Based Communication Aid for Patients

This project is a web-based application that uses a webcam to detect head gestures (nodding for "yes", shaking for "no") to answer a series of questions. It is designed to help patients who have difficulty speaking to communicate their needs.

## Features

-   **Gesture Recognition**: Real-time head gesture detection for "yes" and "no".
-   **Web-Based Interface**: The application runs in a web browser, making it easily accessible.
-   **Question and Answer Flow**: Presents a series of questions and records the user's gesture-based answers.
-   **Text-to-Speech**: Reads the questions aloud to the user.

## Directory Structure

```
.
├── EyeTrack
│   ├── gesture_processor.py  # Processes video frames to detect gestures
│   └── gesture.py            # Standalone script for testing gesture detection
├── api
│   └── apigesture.py         # Unused standalone API server
├── template
│   ├── index.html            # Main HTML file for the frontend
│   ├── styles.css            # CSS styles for the frontend
│   └── app.js                # Client-side JavaScript for UI and WebSocket communication
├── server.js                 # Main entry point: Node.js server for the frontend
├── websocket_server.py       # Python WebSocket server for gesture detection
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## Getting Started

### Prerequisites

-   Node.js
-   Python 3
-   A webcam

### Installation

1.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

2.  **Install Python dependencies:**

    ```bash
    pip install websockets opencv-python mediapipe
    ```

### Running the Application

1.  **Start the server:**

    ```bash
    node server.js
    ```

2.  Open your web browser and navigate to `http://localhost:4000`.

## Architecture and Flow

The application consists of two main parts: a Node.js web server that serves the frontend, and a Python WebSocket server that handles the gesture detection.

**Ports Used:**

-   `4000`: The main web server (`server.js`).
-   `8765`: The Python WebSocket server (`websocket_server.py`).

**Flowchart:**

1.  The user opens `http://localhost:4000` in their browser.
2.  The `server.js` (running on port 4000) serves the frontend application from the `template` directory.
3.  `server.js` also starts the `websocket_server.py` as a background process.
4.  The `websocket_server.py` starts a WebSocket server on `ws://localhost:8765`.
5.  The frontend JavaScript (`app.js`) connects to the WebSocket server.
6.  `app.js` accesses the user's webcam and starts sending video frames to the WebSocket server.
7.  `websocket_server.py` receives the frames and uses the `GestureProcessor` to analyze them for "yes" or "no" gestures.
8.  When a gesture is detected, `websocket_server.py` sends the result back to the browser via the WebSocket connection.
9.  `app.js` receives the gesture and updates the UI to show the answer and move to the next question.

## Technologies Used

-   **Frontend**: HTML, CSS, JavaScript
-   **Backend**: Node.js, Express.js, Python
-   **Libraries**:
    -   `websockets` (Python): For WebSocket communication.
    -   `opencv-python`: For video processing.
    -   `mediapipe`: For face mesh and landmark detection.
-   **Package Manager**: npm
