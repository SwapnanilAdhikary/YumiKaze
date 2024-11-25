import fal_client
import os

# Function to handle queue updates
def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
            print(log["message"])

# Main function to subscribe for frame interpolation
def main():
    # Ensure the API key is set
    api_key = os.getenv('FAL_KEY_ID')
    if not api_key:
        print("Error: Please set your FAL_KEY environment variable.")
        return

    # Subscribe to the frame interpolation service
    result = fal_client.subscribe(
        "fal-ai/amt-interpolation/frame-interpolation",
        arguments={
            "frames": [{
                "url": "https://storage.googleapis.com/falserverless/model_tests/amt-interpolation/start.png"
            }, {
                "url": "https://storage.googleapis.com/falserverless/model_tests/amt-interpolation/end.png"
            }]
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )
    
    # Print the result of the interpolation request
    print("Interpolation Request Result:")
    print(result)

if __name__ == "__main__":
    main()
