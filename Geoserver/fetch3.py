import requests
import time
from datetime import datetime

wms_url = "http://localhost:8080/geoserver/IndiaImages_Mosaic/wms"
params = {
    'service': 'WMS',
    'version': '1.1.0',
    'request': 'GetMap',
    'layers': 'IndiaImages:test',
    'bbox': '59.99928470317995,3.01185912929877,91.99798232543799,32.00785250888025',
    'width': 768,
    'height': 695,
    'srs': 'EPSG:4326',
    'styles': '',
    'format': 'image/jpeg'
}

while True:
    response = requests.get(wms_url, params=params)
    if response.status_code == 200:
        # Save with a timestamp to avoid overwriting
        filename = f"out_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpeg"
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Image fetched and saved as {filename}")
    else:
        print("Failed to fetch image:", response.status_code, response.text)

    # Sleep for 5 minutes
    time.sleep(3)
