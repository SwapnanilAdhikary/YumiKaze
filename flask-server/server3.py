from flask import Flask, request, jsonify
from flask_cors import CORS
import replicate
import os

# Set up Flask app
app = Flask(__name__)
CORS(app)

# Set Replicate API token
os.environ['REPLICATE_API_TOKEN'] = 'r8_DyCtmqxEJiJQHD7yk2piEuGCp4bMYga1jMCjQ'

@app.route('/interpolate', methods=['POST'])
def interpolate():
    data = request.json
    frame1 = data.get('frame1')
    frame2 = data.get('frame2')
    times_to_interpolate = data.get('times_to_interpolate', 6)  # Default to 6

    try:
        # Run the Replicate model
        output = replicate.run(
            "google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
            input={
                "frame1": frame1,
                "frame2": frame2,
                "times_to_interpolate": times_to_interpolate
            }
        )

        # Convert the output to a string if it's not already
        if isinstance(output, bytes):
            output = output.decode('utf-8')  # Decode bytes to string
        elif not isinstance(output, str):
            output = str(output)  # Convert other types to string

        return jsonify({"output_url": output}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002,debug=True)
