
import asyncio
import websockets
import cv2
import numpy as np
from EyeTrack.gesture_processor import GestureProcessor
import base64

gesture_processor = GestureProcessor()

async def handler(websocket):
    print("Client connected")
    try:
        async for message in websocket:
            # The message is expected to be a base64 encoded image
            img_data = base64.b64decode(message.split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            gesture = gesture_processor.process_frame(frame)

            if gesture:
                print(f"Detected gesture: {gesture}")
                await websocket.send(gesture)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"An error occurred: {e}")

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
