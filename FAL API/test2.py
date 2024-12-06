import fal_client
import os
import requests
os.environ['FAL_KEY'] = '5c40d660-d869-4ad4-9d54-3fa7fb41235e:0ffb788e880f642e462071fee6dd1c6e'

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/amt-interpolation/frame-interpolation",
    arguments={
        "frames": [{
            "url": "https://replicate.delivery/pbxt/LoWjlRzn7VXYhVfU6TWU84yR8zq8PsoloCeC5nm9hRPP3pVI/77.jpg"
        }, {
            "url": "https://replicate.delivery/pbxt/LoWjmCToVFAUIdd3zNGvXYrYPS0l2wz7r1RyP96eaPJ3sqWZ/7.jpg"
        }]
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
