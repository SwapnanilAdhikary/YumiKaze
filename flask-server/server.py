from flask import Flask, jsonify, send_file
from flask_cors import CORS
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
import os
from features import load_image
from features import Interpolator
from features import interpolate_recursively
from features import save_video

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/GPU-Interpolate', methods=['POST'])
def gpu_interpolate():
    try:
        image_1_url = "hind.jpg"
        image_2_url = "hind2.jpg"
        image1 = load_image(image_1_url)
        image2 = load_image(image_2_url)

        times_to_interpolate = 6
        interpolator = Interpolator()

        input_frames = [image1, image2]
        frames = list(
    interpolate_recursively(input_frames, times_to_interpolate, interpolator))
        output_filename = 'interpolated_video.webm'
        save_video(frames, output_filename)

        return jsonify({"message": "Video created successfully!", "video_path": output_filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/download-video/<filename>', methods=['GET'])
def download_video(filename):
    return send_file(filename, as_attachment=True)
# @app.route('/FAL-Interpolation',methods=['POST'])
# def Fal_Interpolate(update):
#     on_queue_update(update)

if __name__ == '__main__':
    app.run(debug=True)
