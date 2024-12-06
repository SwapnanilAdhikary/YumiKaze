"use client"
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { Overlay, View } from 'ol';
import OSM from 'ol/source/OSM'; 
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon, Stroke, Fill } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { ZoomSlider } from 'ol/control';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Film, { interpolateFrames } from '../../utils/FILM Server';
import FAL from '../../utils/FAL server';
import GPU from '../../utils/GPU';
import { AudioWaveform, FastForward } from 'lucide-react';
import axios from 'axios';
import 'shepherd.js/dist/css/shepherd.css';
import Shepherd from 'shepherd.js';


// async function moveFile(cnt) {
//   try {
//     const response = await fetch("api/interpolatedApi", {
//       // Ensure the path is correct
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ cnt }), // Send the count in the request body
//     });

//     const data = await response.json();

//     if (response.ok) {
//       console.log("File moved successfully:", data.message);
//       return true;
//     } else {
//       console.error("Error:", data.error);
//       return false;
//     }
//   } catch (err) {
//     console.error("Request failed:", err);
//     return false;
//   }
// }

export default function Home() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true); 
  const [videoSrc, setVideoSrc] = useState("test2.webm");
  const [isLoading,setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);
  const [output, setOutput] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  // runway api => test.mp4 file -> replace with previous test.mp4
//  let cnt = 1;

//  // Use setInterval to run the function every 2 seconds
//  const interval = setInterval(() => {
//    console.log("Test running ", cnt);
//    const success = moveFile(cnt);
//    if(!success) console.log("Fuck yrr kaam nhi kr rha!!!")
//    cnt++; // Increment the count

//    // Optional: Stop after a certain number of iterations (for testing purposes)
//    if (cnt > 3) {
//      // Stop after 5 iterations
//      clearInterval(interval); // Stop the interval
//      console.log("Finished moving files.");
//    }
//  }, 2000);

useEffect(() => {
  const container = document.getElementById('inter');

  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 300,
      },
    },
    positioning: 'center-center',
    stopEvent: true,
    position: fromLonLat([78.9629, 20.5937]), // India
  });

  const osmLayer = new TileLayer({
    preload: Infinity,
    source: new OSM(),
  });

  const pointerSource = new VectorSource();
  const pointerLayer = new VectorLayer({
    source: pointerSource,
    style: new Style({
      image: new Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/252/252025.png', //  icon
        scale: 0.1,
      }),
    }),
  });

  const gridSource = new VectorSource();
  const gridLayer = new VectorLayer({
    source: gridSource,
    style: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.5)', // Grid line color
        width: 1,
      }),
    }),
  });

  const createGrid = (extent) => {
    const [minX, minY, maxX, maxY] = extent;
    const features = [];
    for (let x = minX; x <= maxX; x += 1000000) {
      // Adjust spacing as needed
      features.push(new Feature(new LineString([[x, minY], [x, maxY]])));
    }
    for (let y = minY; y <= maxY; y += 1000000) {
      features.push(new Feature(new LineString([[minX, y], [maxX, y]])));
    }
    return features;
  };

  const extent = [
    fromLonLat([78.9629, 20.5937])[0] - 5000000,
    fromLonLat([78.9629, 20.5937])[1] - 5000000,
    fromLonLat([78.9629, 20.5937])[0] + 5000000,
    fromLonLat([78.9629, 20.5937])[1] + 5000000,
  ];

  gridSource.addFeatures(createGrid(extent));

  const view = new View({
    center: fromLonLat([78.9629, 20.5937]),
    zoom: 2,
    maxZoom: 8,
    minZoom: 5,
  });

  const map = new Map({
    target: 'map',
    layers: [osmLayer, gridLayer, pointerLayer],
    view: view,
    overlays: [overlay],
  });

  const zoomSlider = new ZoomSlider();
  map.addControl(zoomSlider);

  const adjustVideoSizeAndPosition = () => {
    const zoom = view.getZoom();
    overlay.setPosition(fromLonLat([78.9629, 20.5937]));

    const scaleFactor = Math.pow(2, zoom - 4);
    const videoWidth = Math.max(500, 750 * scaleFactor);
    const videoHeight = Math.max(500, 500 * scaleFactor);

    Object.assign(container.style, {
      width: `${videoWidth}px`,
      height: `${videoHeight}px`,
      position: 'relative',
    });
  };

  view.on('change:resolution', adjustVideoSizeAndPosition);
  adjustVideoSizeAndPosition();

  const searchLocation = async (query) => {
    if (!query) return;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(
        query
      )}`
    );
    const results = await response.json();

    if (results.length > 0) {
      const { lat, lon } = results[0];
      const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);

      const marker = new Feature({
        geometry: new Point(coordinates),
      });
      pointerSource.clear();
      pointerSource.addFeature(marker);
    } else {
      alert('Location not found');
    }
  };

  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('searchInput');

  searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    searchLocation(query);
  });

  // Shepherd.js Tour Integration
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'shepherd-theme-arrows',
      scrollTo: true,
    },
  });

  // Add tour steps
  tour.addStep({
    id: 'intro',
    text: 'Welcome to the interactive map! Let me show you around.',
    attachTo: {
      element: '#map',
      on: 'center',
    },
    buttons: [
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: 'zoom-controls',
    text: 'Use the zoom slider here to adjust the map zoom level.',
    attachTo: {
      element: '.ol-zoomslider',
      on: 'right',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: 'search-location',
    text: 'You can search for locations in India using the search bar.',
    attachTo: {
      element: '#searchInput',
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id:'FILM Interpolation',
    text:'You can you the Frame interpolation on the FILM server',
    attachTo:{
      element:'#Replicate',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id:'FAL Interpolation',
    text:'You can you the Frame interpolation on the FAL server, its super Fast compared to others',
    attachTo:{
      element:'#FAL',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id:'GPU Interpolation',
    text:'You can also use your very Own GPU for the interpolation purpose , make suyre your GPU have Cuda compatibility',
    attachTo:{
      element:'#GPU',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Complete',
        action: tour.next,
      },
    ],
  })
  tour.addStep({
    id:'Play/Pause',
    text:'Play pause at your own convinience',
    attachTo:{
      element:'#Pause',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id:'Speed Control',
    text:'Control the speed of the interpolation',
    attachTo:{
      element:'#IamSPeed',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id:'Custom Over to test your own overlay',
    text:'you can also test the Overlay with your own Overlay',
    attachTo:{
      element:'#CustomVid',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })
  tour.addStep({
    id:'Update',
    text:'Update the overlay when Interpolation Ends',
    attachTo:{
      element:'#Updater',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Complete',
        action: tour.complete,
      },
    ],
  })

  // Start the tour when the map loads
  tour.start();

  return () => {
    map.setTarget(null); // Clean up
  };
}, []);

  const handleInterpolate = async () => {
    const payload = {
      frame1: "https://iili.io/2ajXTP9.jpg",
      frame2: "https://iili.io/2ajXf8G.jpg",
      times_to_interpolate: 6,
    };
  
    try {
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
    }
  };
  const handleClickFAL = async () => {
    try {
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
    }
  };
  

  const GPUClick = () => {
    GPU();
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying); 
    }
  };
  const [playbackRate, setPlaybackRate] = useState(1.0); 

const adjustSpeed = () => {
  if (videoRef.current) {
    const newRate = playbackRate === 1.0 ? 0.5 : 1.0; 
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate); 
  }
};
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const newVideoSrc = URL.createObjectURL(file); 

    if (videoRef.current) {
      
      videoRef.current.src = newVideoSrc;
      videoRef.current.load(); 
      videoRef.current.play(); 
    }
  }
};
// const handleGPUClick = async () => {
//   try {
//       const response = await axios.post('http://localhost:5000/GPU-Interpolate');
//       setResponseData(response.data); // Store the response data in state
//       setError(null); // Clear any previous errors
      
//   } catch (error) {
//       console.error("Error calling the function:", error);
//       setError("An error occurred while calling the function."); // Set error message
//       setResponseData(null); // Clear any previous response data
//   }
// };
const updateVideo = (newSrc) => {
  setVideoSrc(newSrc); 
  setIsLoading(true); 
  if (videoRef.current) {
    videoRef.current.pause(); 
    videoRef.current.src = newSrc; 
    videoRef.current.load(); 
    videoRef.current.play(); 
  }
};

const handleCanPlay = () => {
  setIsLoading(false); 
};

const handleWaiting = () => {
  setIsLoading(true); 
};
const handleClickGPU = async () => {
  try {
    const response = await axios.post('http://localhost:5000/GPU-Interpolate');
    setResponseData(response.data); // Store the response data in state
    setError(null); // Clear any previous errors

    if (response.data && response.data.video_path) {
      const videoUrl = `http://localhost:5000/download-video/${response.data.video_path}`;
      setVideoSrc(videoUrl); // Update the video source dynamically
      console.log("Interpolation complete. Video updated:", videoUrl);
    } else {
      console.error("No video path received in response.");
    }
  } catch (error) {
    console.error("Error calling the function:", error);
    setError("An error occurred while calling the function."); // Set error message
    setResponseData(null); // Clear any previous response data
  }
};

return (
  <>
    <div style={{ display: 'flex', padding: '10px', position: 'absolute', zIndex: 10, background: 'white',top:'1px' }}>
      <Input
        id="searchInput"
        type="text"
        placeholder="Search for a location in India"
        style={{ width: '300px', padding: '5px', marginRight: '5px' }}
      />
      <Button id="searchButton" style={{ padding: '5px' }}>
        Search
      </Button>
    </div>

    <div style={{ height: '900px', width: '100%', pointerEvents: 'auto' }} id="map" className="map-container relative z-1" />

    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        top: '150px', 
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column', 
        gap: '10px',
      }}
    >
      <Button id="Replicate" style={{ padding: '5px', background: 'black', color: 'white', borderRadius: '5px'  }}
        onClick={handleInterpolate}
      >
        FILM(server side)
      </Button>
      <Button id="FAL" style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={handleClickFAL}
      >
        FAL(server side)
      </Button>
      <Button id="GPU"  style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={handleClickGPU}
      >
        FILM(Client Side/GPU)
      </Button>
      
      <Button id="Pause" style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={togglePlayPause}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        id="IamSPeed"
        style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={adjustSpeed}
      >
        {playbackRate === 1.0 ? 'Slow Down' : 'Normal Speed'}
      </Button>
    </div>

    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '10px',
        zIndex: 10,
        background: 'white',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Input
        id="CustomVid"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ padding: '15px', cursor: 'pointer' }}
      />
      <Button id="Updater" onClick={()=>updateVideo(videoSrc)}>Update Overlay</Button>
    <div>
    {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            width: '50px',
            height: '50px',
            border: '5px solid rgba(0.1, 0.1, 0.1, 0.1)',
            borderTop: '5px solid black',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      
    </div>  

      
    </div>

    <video
  ref={videoRef}
  id="inter"
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none',
    opacity: 0.65,
  }}
  autoPlay
  loop
  muted
  onCanPlay={handleCanPlay} 
  onWaiting={handleWaiting} 
>
  
  <source src={videoSrc} type="video/webm" />
  Your browser does not support the video tag.
</video>
  </>
);
}