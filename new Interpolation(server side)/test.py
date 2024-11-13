import replicate
import os

os.environ['REPLICATE_API_TOKEN'] = 'r8_OGWkutyJjc6JCgt3XM7UrmrcNTacMmD47f8zB'

output = replicate.run(
    "zsxkib/film-frame-interpolation-for-large-motion:222d67420da179935a68afff47093bab48705fe9e09c3c79268c1eb2ee7c5e91",
    input={
        "mp4": "https://replicate.delivery/pbxt/z6f9qKeowcnbIkkG99tADk0NSA1j6diZ3pYziwRLXoRo9gwTA/a_smiling_girl.mp4",
        "num_interpolation_steps": 1,
        "playback_frames_per_second": 28
    }
)
print(output)