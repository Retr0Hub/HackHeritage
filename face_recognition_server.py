import asyncio
import websockets
import cv2
import numpy as np
import face_recognition
import os
import base64

known_face_encodings = []
known_face_names = []

def load_known_faces(dataset_path="FaceSignIn/dataset/images"):
    print("Loading known faces...")
    for person_name in os.listdir(dataset_path):
        person_dir = os.path.join(dataset_path, person_name)
        if os.path.isdir(person_dir):
            for image_name in os.listdir(person_dir):
                if image_name.endswith((".jpg", ".png", ".jpeg")):
                    image_path = os.path.join(person_dir, image_name)
                    try:
                        image = face_recognition.load_image_file(image_path)
                        face_encodings = face_recognition.face_encodings(image)
                        if face_encodings:
                            known_face_encodings.append(face_encodings[0])
                            known_face_names.append(person_name)
                            print(f"Loaded {person_name} from {image_name}")
                        else:
                            print(f"No face found in {image_name} for {person_name}")
                    except Exception as e:
                        print(f"Error loading {image_path}: {e}")
    print(f"Loaded {len(known_face_names)} known faces.")

async def recognize_face(websocket):
    print("Client connected to face recognition server.")
    try:
        async for message in websocket:
            img_data = base64.b64decode(message.split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            rgb_small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)[:, :, ::-1]

            face_encodings = face_recognition.face_encodings(rgb_small_frame)

            name = "Unknown"
            if face_encodings:
                face_distances = face_recognition.face_distance(known_face_encodings, face_encodings[0])
                best_match_index = np.argmin(face_distances)
                if face_recognition.compare_faces(known_face_encodings, face_encodings[0])[best_match_index]:
                    name = known_face_names[best_match_index]
            
            await websocket.send(name)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected from face recognition server.")
    except Exception as e:
        print(f"An error occurred in face recognition: {e}")

async def main():
    load_known_faces()
    async with websockets.serve(recognize_face, "localhost", 8766):
        print("Face recognition WebSocket server started on ws://localhost:8766")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
