import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
from typing import Generator, Iterable, List

_UINT8_MAX_F = float(np.iinfo(np.uint8).max)

def load_image(image_path: str):
    image = tf.io.read_file(image_path)
    image = tf.io.decode_image(image, channels=3)
    image = tf.image.resize(image, (400, 400))
    image_numpy = tf.cast(image, dtype=tf.float32).numpy()
    return image_numpy / _UINT8_MAX_F

# image_1_url = "data/frame_000066.png"
# image_2_url = "data/frame_000095.png"
image_1_url = "hind.jpg"
image_2_url = "hind2.jpg"

time = np.array([0.5], dtype=np.float32)

image1 = load_image(image_1_url)
image2 = load_image(image_2_url)

def _pad_to_align(x, align):
    assert np.ndim(x) == 4
    assert align > 0, 'align must be a positive number.'

    height, width = x.shape[-3:-1]
    height_to_pad = (align - height % align) if height % align != 0 else 0
    width_to_pad = (align - width % align) if width % align != 0 else 0

    bbox_to_pad = {
        'offset_height': height_to_pad // 2,
        'offset_width': width_to_pad // 2,
        'target_height': height + height_to_pad,
        'target_width': width + width_to_pad
    }
    padded_x = tf.image.pad_to_bounding_box(x, **bbox_to_pad)
    bbox_to_crop = {
        'offset_height': height_to_pad // 2,
        'offset_width': width_to_pad // 2,
        'target_height': height,
        'target_width': width
    }
    return padded_x, bbox_to_crop

class Interpolator:

    def __init__(self, align: int = 64) -> None:
        self._model = hub.load("https://tfhub.dev/google/film/1")
        self._align = align

    def __call__(self, x0: np.ndarray, x1: np.ndarray, dt: np.ndarray) -> np.ndarray:
        if self._align is not None:
            x0, bbox_to_crop = _pad_to_align(x0, self._align)
            x1, _ = _pad_to_align(x1, self._align)

        inputs = {'x0': x0, 'x1': x1, 'time': dt[..., np.newaxis]}
        result = self._model(inputs, training=False)
        image = result['image']

        if self._align is not None:
            image = tf.image.crop_to_bounding_box(image, **bbox_to_crop)
        return image.numpy()

def _recursive_generator(
    frame1: np.ndarray, frame2: np.ndarray, num_recursions: int,
    interpolator: Interpolator) -> Generator[np.ndarray, None, None]:

    if num_recursions == 0:
        yield frame1
    else:
        time = np.full(shape=(1,), fill_value=0.5, dtype=np.float32)
        mid_frame = interpolator(
            np.expand_dims(frame1, axis=0), np.expand_dims(frame2, axis=0), time)[0]
        yield from _recursive_generator(frame1, mid_frame, num_recursions - 1,
                                        interpolator)
        yield from _recursive_generator(mid_frame, frame2, num_recursions - 1,
                                        interpolator)

def interpolate_recursively(
    frames: List[np.ndarray], num_recursions: int,
    interpolator: Interpolator) -> Iterable[np.ndarray]:
    n = len(frames)
    for i in range(1, n):
        yield from _recursive_generator(frames[i - 1], frames[i],
                                        num_recursions, interpolator)
    yield frames[-1]

# Save video function
def save_video(frames: List[np.ndarray], filename: str, fps: int = 30):
    height, width, _ = frames[0].shape
    # Use WebM format (VP8 codec)
    fourcc = cv2.VideoWriter_fourcc(*'vp80')  # WebM (VP8 codec)
    video = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    for frame in frames:
        # Convert frame from float32 (0.0 to 1.0) to uint8 (0 to 255)
        frame_uint8 = (frame * 255).astype(np.uint8)
        # Convert from RGB to BGR for OpenCV
        frame_bgr = cv2.cvtColor(frame_uint8, cv2.COLOR_RGB2BGR)
        video.write(frame_bgr)  # Write frame to video file

    video.release()
    print(f"Video saved as {filename}")

# Interpolate frames and save video
times_to_interpolate = 6
interpolator = Interpolator()

input_frames = [image1, image2]
frames = list(
    interpolate_recursively(input_frames, times_to_interpolate, interpolator))

# Save the interpolated video as WebM
output_filename = 'interpolated_video_web_oum.webm'
save_video(frames, output_filename)

print("Download the video:", output_filename)
