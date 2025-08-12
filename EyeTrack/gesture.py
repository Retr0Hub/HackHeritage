from operator import attrgetter
import cv2
import mediapipe as mp
import requests
import time
import threading

mp_drawing = mp.solutions.drawing_utils
mp_face_mesh = mp.solutions.face_mesh

cap = cv2.VideoCapture(0)

# ---------------- SETTINGS ----------------
FRAMES_TO_ANALYZE = 8
NODDING_SENSITIVITY = 0.010
SHAKING_SENSITIVITY = 0.018
VERTICAL_ADJUSTMENT = 0.18
HORIZONTAL_ADJUSTMENT = 0.1

# Emergency nod detection
EMERGENCY_SPEED_THRESHOLD = 0.06     # Fast movement per frame (y-axis)
EMERGENCY_MIN_SPEED_FRAMES = 3       # Must have this many fast frames

API_ENDPOINT = 'http://127.0.0.1:3000/api'  # Single endpoint
API_COOLDOWN = 1.0  # seconds between API sends

# ---------------- STATE ----------------
nodding_coordinates = []
shaking_coordinates = []
last_api_call_time = 0

# ---------------- FUNCTIONS ----------------
def send_api(message):
    """Send to one API endpoint without blocking main loop."""
    global last_api_call_time
    now = time.time()
    if now - last_api_call_time >= API_COOLDOWN:
        def worker():
            try:
                requests.post(API_ENDPOINT, json={'gesture': message}, timeout=0.5)
                print(f"[API] Sent {message}")
            except Exception as e:
                print(f"[API] Failed to send {message}: {e}")
        threading.Thread(target=worker, daemon=True).start()
        last_api_call_time = now

def direction_changes(data, coord, sensitivity):
    """Count significant direction changes."""
    prev_data = None
    current_direction = None
    prev_direction = None
    peak_or_valley = getattr(data[0], coord)
    num_direction_changes = 0

    for i in range(len(data)):
        current_data = getattr(data[i], coord)
        if prev_data:
            if abs(peak_or_valley - current_data) > sensitivity:
                if peak_or_valley > current_data:
                    current_direction = 'increasing'
                else:
                    current_direction = 'decreasing'
                if prev_direction and current_direction != prev_direction:
                    num_direction_changes += 1
                    peak_or_valley = current_data
                elif not prev_direction:
                    prev_direction = current_direction
                    peak_or_valley = current_data
        prev_data = current_data
    return num_direction_changes

def detect_emergency(chin_points):
    """Instant trigger: detect vigorous nod by checking speed."""
    if len(chin_points) < 2:
        return False
    speeds = [abs(chin_points[i].y - chin_points[i-1].y) for i in range(1, len(chin_points))]
    fast_frames = sum(1 for s in speeds if s > EMERGENCY_SPEED_THRESHOLD)
    return fast_frames >= EMERGENCY_MIN_SPEED_FRAMES

# ---------------- MAIN LOOP ----------------
with mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6) as face_mesh:

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        image.flags.writeable = False
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image_rgb)

        image.flags.writeable = True
        image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                chin = face_landmarks.landmark[199]
                sidehead = face_landmarks.landmark[447]
                tophead = face_landmarks.landmark[10]
                bottomhead = face_landmarks.landmark[152]

                distance_adjustment = (bottomhead.y - tophead.y) / 0.5

                nodding_coordinates.append(chin)
                shaking_coordinates.append(sidehead)

                if len(nodding_coordinates) > FRAMES_TO_ANALYZE:
                    nodding_coordinates.pop(0)
                    shaking_coordinates.pop(0)

                    # Instant emergency detection
                    if detect_emergency(nodding_coordinates):
                        send_api('EMERGENCY')
                        nodding_coordinates.clear()
                        shaking_coordinates.clear()
                        continue  # Skip YES/NO detection if emergency triggered

                    nod_changes = direction_changes(
                        nodding_coordinates, "z", NODDING_SENSITIVITY * distance_adjustment)
                    shake_changes = direction_changes(
                        shaking_coordinates, "z", SHAKING_SENSITIVITY * distance_adjustment)

                    vertical_movement = abs(
                        max(nodding_coordinates, key=attrgetter('y')).y -
                        min(nodding_coordinates, key=attrgetter('y')).y
                    )
                    horizontal_movement = abs(
                        max(shaking_coordinates, key=attrgetter('x')).x -
                        min(shaking_coordinates, key=attrgetter('x')).x
                    )

                    # YES gesture
                    if (nod_changes > 0 and shake_changes == 0 and
                          vertical_movement <= VERTICAL_ADJUSTMENT * distance_adjustment):
                        send_api('YES')
                        nodding_coordinates.clear()
                        shaking_coordinates.clear()

                    # NO gesture
                    elif (shake_changes > 0 and nod_changes == 0 and
                          horizontal_movement <= HORIZONTAL_ADJUSTMENT * distance_adjustment):
                        send_api('NO')
                        nodding_coordinates.clear()
                        shaking_coordinates.clear()

        #cv2.imshow('Head Movement Detection', cv2.flip(image, 1))
        if cv2.waitKey(5) & 0xFF == 27:
            break

cap.release()
cv2.destroyAllWindows()