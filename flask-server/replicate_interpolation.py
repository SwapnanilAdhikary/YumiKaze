import replicate
import os
import time  
os.environ['REPLICATE_API_TOKEN'] = 'r8_DyCtmqxEJiJQHD7yk2piEuGCp4bMYga1jMCjQ'

def Repl_plate():
    output = replicate.run(
    "google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
    input={
        "frame1": "https://iili.io/2ajXTP9.jpg",
        "frame2": "https://iili.io/2ajXf8G.jpg",
        "times_to_interpolate": 6
    }
)
    print(output)
