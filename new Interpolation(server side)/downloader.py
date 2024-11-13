import requests

def download_mp4(url, filename):
    response = requests.get(url, stream=True)

    if response.status_code == 200:
        with open(filename, 'wb') as file:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    file.write(chunk)
        print(f"Download complete: {filename}")
    else:
        print(f"Failed to retrieve the file. HTTP Status code: {response.status_code}")

mp4_url = "https://replicate.delivery/pbxt/ymg3hDv95VbJApg7GeqKQXd1YfMZ0opghMhrCNG6rjHiHhwTA/output_video.mp4"  
download_mp4(mp4_url, "downloaded_video2.mp4")
