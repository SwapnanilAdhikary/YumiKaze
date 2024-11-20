import requests
import time

wms_url = "http://localhost:8080/geoserver/see/wms"

params = {
    'service': 'WMS',
    'version': '1.1.1',
    'request': 'GetMap',
    'layers': 'see:test',
    'bbox': '78.0,20.0,85.0,30.0',
    'width': 800,
    'height': 600,
    'srs': 'EPSG:4326',
    'format': 'image/jpeg'  # Changed to JPEG format
}

while True:
    try:
        response = requests.get(wms_url, params=params)
        if response.status_code == 200:
            # Save with a timestamp
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f'output_image_{timestamp}.jpeg'  # Changed to .jpeg extension
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"JPEG image fetched and saved as: {filename}")
        else:
            print(f"Failed to fetch image. HTTP Status: {response.status_code}")

        time.sleep(5)  # Adjust as needed
    except Exception as e:
        print(f"An error occurred: {e}")
        time.sleep(1)  # Retry after 5 minutes
