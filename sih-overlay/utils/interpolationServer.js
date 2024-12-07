import axios from "axios";

export const handleInterpolate = async (setVideoSrc, setOutputUrl,setIsLoading) => {
  const payload = {
    frame1: "https://iili.io/2ajXTP9.jpg",
    frame2: "https://iili.io/2ajXf8G.jpg",
    times_to_interpolate: 6,
  };

  try {
    setIsLoading(true)
    const response = await axios.post('http://127.0.0.1:5002/interpolate', payload);
    // Access the output URL from the response data
    setOutputUrl(response.data.output_url);
    console.log("Output URL:", response.data.output_url);
    if (response.data.output_url) {
      const videoUrl = response.data.output_url;
      setVideoSrc(videoUrl); // Update the video source dynamically
      console.log("Interpolation complete. Video updated:", videoUrl);
    } else {
      console.error("No video path received in response.");
    }
  } catch (error) {
    console.error("Error during interpolation:", error.response?.data?.error || error.message);
  }finally{
    setIsLoading(false);
  }
};

export const handleClickFAL = async (setVideoSrc, setResponseData, setError,setIsLoading) => {
  try {
    setIsLoading(true)
    const response = await axios.post('http://127.0.0.1:5001/run-interpolation', {
      frames: [
        { url: "https://iili.io/2ajXTP9.jpg" },
        { url: "https://iili.io/2ajXf8G.jpg" }
      ]
    });
    console.log('Interpolation Result:', response.data.result.video.url);
    setResponseData(response.data); // Store the response data in state
    setError(null);
    if (response.data.result.video.url) {
      const videoUrl = response.data.result.video.url;
      setVideoSrc(videoUrl); // Update the video source dynamically
      console.log("Interpolation complete. Video updated:", videoUrl);
    } else {
      console.error("No video path received in response.");
    }

  } catch (error) {
    console.error('Error running interpolation:', error);
  }finally{
    setIsLoading(false);
  }
};
