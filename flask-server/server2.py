import fal_client
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

# Set environment variable for FAL API key
os.environ['FAL_KEY'] = '5c40d660-d869-4ad4-9d54-3fa7fb41235e:0ffb788e880f642e462071fee6dd1c6e'

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (important for React communication)

# Function to log FAL updates
def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
            print(log["message"])

@app.route('/run-interpolation', methods=['POST'])
def run_interpolation():
    try:
        # Extract data from request
        data = request.get_json()
        if not data or "frames" not in data:
            return jsonify({"error": "Invalid request. 'frames' key is required."}), 400

        # Run the FAL client subscription
        result = fal_client.subscribe(
            "fal-ai/amt-interpolation/frame-interpolation",
            arguments={
                "frames": data["frames"]  # Pass frames from the request
            },
            with_logs=True,
            on_queue_update=on_queue_update,
        )

        # Return the result
        return jsonify({"result": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)  
