from flask import Flask, request

app = Flask(__name__)

@app.route("/api", methods=["POST"])
def receive_gesture():
    data = request.json
    print("Received:", data)
    return {"status": "ok"}, 200

if __name__ == "__main__":
    app.run(port=3001)
