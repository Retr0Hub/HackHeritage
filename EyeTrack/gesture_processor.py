
import cv2
import mediapipe as mp
import time
from operator import attrgetter

class GestureProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6
        )
        self.nodding_coordinates = []
        self.shaking_coordinates = []
        self.last_api_call_time = 0

        # Settings
        self.FRAMES_TO_ANALYZE = 8
        self.NODDING_SENSITIVITY = 0.010
        self.SHAKING_SENSITIVITY = 0.018
        self.VERTICAL_ADJUSTMENT = 0.18
        self.HORIZONTAL_ADJUSTMENT = 0.1
        self.EMERGENCY_SPEED_THRESHOLD = 0.06
        self.EMERGENCY_MIN_SPEED_FRAMES = 3

    def direction_changes(self, data, coord, sensitivity):
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

    def detect_emergency(self, chin_points):
        if len(chin_points) < 2:
            return False
        speeds = [abs(chin_points[i].y - chin_points[i-1].y) for i in range(1, len(chin_points))]
        fast_frames = sum(1 for s in speeds if s > self.EMERGENCY_SPEED_THRESHOLD)
        return fast_frames >= self.EMERGENCY_MIN_SPEED_FRAMES

    def process_frame(self, image):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        gesture = None

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                chin = face_landmarks.landmark[199]
                sidehead = face_landmarks.landmark[447]
                tophead = face_landmarks.landmark[10]
                bottomhead = face_landmarks.landmark[152]

                distance_adjustment = (bottomhead.y - tophead.y) / 0.5

                self.nodding_coordinates.append(chin)
                self.shaking_coordinates.append(sidehead)

                if len(self.nodding_coordinates) > self.FRAMES_TO_ANALYZE:
                    self.nodding_coordinates.pop(0)
                    self.shaking_coordinates.pop(0)

                    if self.detect_emergency(self.nodding_coordinates):
                        gesture = 'EMERGENCY'
                        self.nodding_coordinates.clear()
                        self.shaking_coordinates.clear()
                        return gesture

                    nod_changes = self.direction_changes(
                        self.nodding_coordinates, "z", self.NODDING_SENSITIVITY * distance_adjustment)
                    shake_changes = self.direction_changes(
                        self.shaking_coordinates, "z", self.SHAKING_SENSITIVITY * distance_adjustment)

                    vertical_movement = abs(
                        max(self.nodding_coordinates, key=attrgetter('y')).y -
                        min(self.nodding_coordinates, key=attrgetter('y')).y
                    )
                    horizontal_movement = abs(
                        max(self.shaking_coordinates, key=attrgetter('x')).x -
                        min(self.shaking_coordinates, key=attrgetter('x')).x
                    )

                    if (nod_changes > 0 and shake_changes == 0 and
                          vertical_movement <= self.VERTICAL_ADJUSTMENT * distance_adjustment):
                        gesture = 'YES'
                        self.nodding_coordinates.clear()
                        self.shaking_coordinates.clear()

                    elif (shake_changes > 0 and nod_changes == 0 and
                          horizontal_movement <= self.HORIZONTAL_ADJUSTMENT * distance_adjustment):
                        gesture = 'NO'
                        self.nodding_coordinates.clear()
                        self.shaking_coordinates.clear()
        
        return gesture
