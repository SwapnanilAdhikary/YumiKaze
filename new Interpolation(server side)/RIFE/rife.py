import replicate
import os
os.environ['REPLICATE_API_TOKEN'] = 'r8_OGWkutyJjc6JCgt3XM7UrmrcNTacMmD47f8zB'
output = replicate.run(
    "camenduru/dynami-crafter-interpolation-320x512:cb864c3f64d31acd5e3487e042123b7522fc3f19a66af2c42b7b5204e6f38dd4",
    input={
        "fs": 20,
        "eta": 1,
        "seed": 12306,
        "steps": 50,
        "prompt": "a smiling girl",
        "cfg_scale": 7.5,
        "image1_path": "https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg",
        "image2_path": "https://mausam.imd.gov.in/Satellite/3Dasiasec_wv.jpg"
    }
)
print(output)