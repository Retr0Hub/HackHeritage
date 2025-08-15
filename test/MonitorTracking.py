import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import pyautogui
import math
import threading
import time
import keyboard

# Monitor setup
MONITOR_WIDTH, MONITOR_HEIGHT = pyautogui.size()
CENTER_X = MONITOR_WIDTH // 2
CENTER_Y = MONITOR_HEIGHT // 2
mouse_control_enabled = True

# Stability settings
filter_length = 20  # number of frames to average for direction
smooth_factor = 0.2  # 0=frozen, 1=instant response
prev_screen_x = CENTER_X
prev_screen_y = CENTER_Y

# Face mesh points
FACE_OUTLINE_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356,
    454, 323, 361, 288, 397, 365, 379, 378,
    400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21,
    54, 103, 67, 109
]

mouse_target = [CENTER_X, CENTER_Y]
mouse_lock = threading.Lock()

calibration_offset_yaw = 0
calibration_offset_pitch = 0

ray_origins = deque(maxlen=filter_length)
ray_directions = deque(maxlen=filter_length)

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

cap = cv2.VideoCapture(0)  # change to 1 if needed

LANDMARKS = {
    "left": 234,
    "right": 454,
    "top": 10,
    "bottom": 152,
    "front": 1,
}

def mouse_mover():
    while True:
        if mouse_control_enabled:
            with mouse_lock:
                x, y = mouse_target
            pyautogui.moveTo(x, y)
        time.sleep(0.01)

def landmark_to_np(landmark, w, h):
    return np.array([landmark.x * w, landmark.y * h, landmark.z * w])

threading.Thread(target=mouse_mover, daemon=True).start()

last_landmarks_frame = None

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    landmarks_frame = np.zeros_like(frame)

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0].landmark

        for i, landmark in enumerate(face_landmarks):
            pt = landmark_to_np(landmark, w, h)
            x, y = int(pt[0]), int(pt[1])
            if 0 <= x < w and 0 <= y < h:
                color = (155, 155, 155) if i in FACE_OUTLINE_INDICES else (255, 25, 10)
                cv2.circle(landmarks_frame, (x, y), 3, color, -1)
                frame[y, x] = (255, 255, 255)

        key_points = {}
        for name, idx in LANDMARKS.items():
            pt = landmark_to_np(face_landmarks[idx], w, h)
            key_points[name] = pt
            x, y = int(pt[0]), int(pt[1])
            cv2.circle(frame, (x, y), 4, (0, 0, 0), -1)

        left = key_points["left"]
        right = key_points["right"]
        top = key_points["top"]
        bottom = key_points["bottom"]
        front = key_points["front"]

        right_axis = (right - left)
        right_axis /= np.linalg.norm(right_axis)

        up_axis = (top - bottom)
        up_axis /= np.linalg.norm(up_axis)

        forward_axis = np.cross(right_axis, up_axis)
        forward_axis /= np.linalg.norm(forward_axis)
        forward_axis = -forward_axis

        center = (left + right + top + bottom + front) / 5

        half_width = np.linalg.norm(right - left) / 2
        half_height = np.linalg.norm(top - bottom) / 2
        half_depth = 80

        def corner(x_sign, y_sign, z_sign):
            return (center
                    + x_sign * half_width * right_axis
                    + y_sign * half_height * up_axis
                    + z_sign * half_depth * forward_axis)

        cube_corners = [
            corner(-1, 1, -1), corner(1, 1, -1),
            corner(1, -1, -1), corner(-1, -1, -1),
            corner(-1, 1, 1),  corner(1, 1, 1),
            corner(1, -1, 1),  corner(-1, -1, 1)
        ]

        def project(pt3d):
            return int(pt3d[0]), int(pt3d[1])

        cube_corners_2d = [project(pt) for pt in cube_corners]
        edges = [
            (0, 1), (1, 2), (2, 3), (3, 0),
            (4, 5), (5, 6), (6, 7), (7, 4),
            (0, 4), (1, 5), (2, 6), (3, 7)
        ]
        for i, j in edges:
            cv2.line(frame, cube_corners_2d[i], cube_corners_2d[j], (255, 125, 35), 2)

        ray_origins.append(center)
        ray_directions.append(forward_axis)

        avg_origin = np.mean(ray_origins, axis=0)
        avg_direction = np.mean(ray_directions, axis=0)
        avg_direction /= np.linalg.norm(avg_direction)

        reference_forward = np.array([0, 0, -1])

        xz_proj = np.array([avg_direction[0], 0, avg_direction[2]])
        xz_proj /= np.linalg.norm(xz_proj)
        yaw_rad = math.acos(np.clip(np.dot(reference_forward, xz_proj), -1.0, 1.0))
        if avg_direction[0] < 0:
            yaw_rad = -yaw_rad

        yz_proj = np.array([0, avg_direction[1], avg_direction[2]])
        yz_proj /= np.linalg.norm(yz_proj)
        pitch_rad = math.acos(np.clip(np.dot(reference_forward, yz_proj), -1.0, 1.0))
        if avg_direction[1] > 0:
            pitch_rad = -pitch_rad

        yaw_deg = np.degrees(yaw_rad)
        pitch_deg = np.degrees(pitch_rad)

        if yaw_deg < 0:
            yaw_deg = abs(yaw_deg)
        elif yaw_deg < 180:
            yaw_deg = 360 - yaw_deg

        if pitch_deg < 0:
            pitch_deg = 360 + pitch_deg

        raw_yaw_deg = yaw_deg
        raw_pitch_deg = pitch_deg

        yawDegrees = 20
        pitchDegrees = 10

        yaw_deg += calibration_offset_yaw
        pitch_deg += calibration_offset_pitch

        screen_x = int(((yaw_deg - (180 - yawDegrees)) / (2 * yawDegrees)) * MONITOR_WIDTH)
        screen_y = int(((180 + pitchDegrees - pitch_deg) / (2 * pitchDegrees)) * MONITOR_HEIGHT)
        
        # Apply smoothing
        screen_x = int(prev_screen_x + (screen_x - prev_screen_x) * smooth_factor)
        screen_y = int(prev_screen_y + (screen_y - prev_screen_y) * smooth_factor)
        prev_screen_x, prev_screen_y = screen_x, screen_y

        screen_x = max(10, min(MONITOR_WIDTH - 10, screen_x))
        screen_y = max(10, min(MONITOR_HEIGHT - 10, screen_y))

        print(f"Screen position: x={screen_x}, y={screen_y}")

        if mouse_control_enabled:
            with mouse_lock:
                mouse_target[0] = screen_x
                mouse_target[1] = screen_y

        ray_length = 2.5 * half_depth
        ray_end = avg_origin - avg_direction * ray_length
        cv2.line(frame, project(avg_origin), project(ray_end), (15, 255, 0), 3)
        cv2.line(landmarks_frame, project(avg_origin), project(ray_end), (15, 255, 0), 3)

        last_landmarks_frame = landmarks_frame.copy()

    else:
        if last_landmarks_frame is not None:
            landmarks_frame = last_landmarks_frame.copy()

    cv2.imshow("Head-Aligned Cube", frame)
    cv2.imshow("Facial Landmarks", landmarks_frame)

    if keyboard.is_pressed('f7'):
        mouse_control_enabled = not mouse_control_enabled
        print(f"[Mouse Control] {'Enabled' if mouse_control_enabled else 'Disabled'}")
        time.sleep(0.3)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('c'):
        calibration_offset_yaw = 180 - raw_yaw_deg
        calibration_offset_pitch = 180 - raw_pitch_deg
        print(f"[Calibrated] Offset Yaw: {calibration_offset_yaw}, Offset Pitch: {calibration_offset_pitch}")

cap.release()
cv2.destroyAllWindows()
