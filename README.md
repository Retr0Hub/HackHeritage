# Eye-Track Next

**Eye-Track Next** is a Next.js web app enabling users with motor disabilities to navigate and interact using eye-tracking. It's designed for simplicity, accessibility, and real-world usability.

---

##  Features

- **Gaze-based navigation**: Move between interface elements using eye movement.
- **Blink or dwell confirm**: Activate selections with a blink or sustained gaze.
- **Configurable sensitivity**: Adjust detection thresholds for diverse needs.
- **Visual feedback**: Highlight focused elements to aid user awareness.
- **Keyboard fallback**: Full alternative for users without eye-tracking hardware.

---

##  Getting Started

### Prerequisites
- Node.js (v14+)
- Modern browser with WebGazer.js support
- Basic eye-tracker compatibility (e.g., built-in webcam)

### Setup
```bash
git clone https://github.com/Retr0Hub/HackHeritage.git
cd HackHeritage
npm install
npm run dev
python EyeTrack/main.py

REQUIREMENTS
------------
- Python 3.x
- OpenCV
- MediaPipe
- NumPy
- PyAutoGUI
- Keyboard

To install the required packages:
```bash
    pip install opencv-python mediapipe numpy pyautogui keyboard
```

USAGE
-----
1. Ensure a webcam is connected. The script defaults to camera index 1. Change to 0 if needed.
2. Run the script:
```bash
    python MonitorTracking.py
```