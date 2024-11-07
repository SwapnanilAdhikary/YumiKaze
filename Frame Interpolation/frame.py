import cv2
import os

def video_to_frames(video_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break  
        frame_filename = os.path.join(output_dir, f"frame_{frame_count:06d}.png")
        cv2.imwrite(frame_filename, frame)
        frame_count += 1

        print(f"Saved {frame_filename}")
    
    cap.release()
    print("Video processing complete.")

# Example usage
video_path = 'path_to_your_video.mp4'
output_dir = 'path_to_output_frames'
video_to_frames("data/Recording 2024-11-05 200048.mp4", "data")
