"use client"
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { Overlay, View } from 'ol';
import OSM from 'ol/source/OSM';
import LineString from 'ol/geom/LineString';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon, Stroke } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { ZoomSlider } from 'ol/control';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import 'shepherd.js/dist/css/shepherd.css';
import Shepherd from 'shepherd.js';
import { handleClickFAL, handleInterpolate } from '../../utils/interpolationServer';

export default function Home() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoSrc, setVideoSrc] = useState("new2.mp4");
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);
  const [output, setOutput] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);

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
      stopEvent: false,     ///don't touch
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
      fromLonLat([78.9629, 20.5937])[0] - 2000000,
      fromLonLat([78.9629, 20.5937])[1] - 2000000,
      fromLonLat([78.9629, 20.5937])[0] + 2000000,
      fromLonLat([78.9629, 20.5937])[1] + 2000000,
    ];

    gridSource.addFeatures(createGrid(extent));

    const view = new View({
      center: fromLonLat([78.9629, 20.5937]),
      zoom: 2,
      maxZoom: 8,
      minZoom: 5,
      extent: extent,
      
    });

    const map = new Map({
      target: 'map',
      layers: [osmLayer, gridLayer, pointerLayer],
      view: view,
      overlays: [overlay],
    });

    const zoomSlider = new ZoomSlider({

    });
    map.addControl(zoomSlider);
//video height w\fixing
    const adjustVideoSizeAndPosition = () => {
      const zoom = view.getZoom();
      overlay.setPosition(fromLonLat([78.9629, 20.5937]));

      const scaleFactor = Math.pow(2, zoom - 4);
      const videoWidth = Math.max(500, 750* scaleFactor);
      const videoHeight = Math.max(500, 500 * scaleFactor);
      console.log("zoom")
      console.log(zoom)
      console.log("video width")
      console.log(videoWidth)
      console.log("height")
      console.log(videoHeight)
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
        // scrollTo: true,
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
      id: 'FILM Interpolation',
      text: 'You can you the Frame interpolation on the FILM server',
      attachTo: {
        element: '#Replicate',
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
      id: 'FAL Interpolation',
      text: 'You can you the Frame interpolation on the FAL server, its super Fast compared to others',
      attachTo: {
        element: '#FAL',
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
      id: 'GPU Interpolation',
      text: 'You can also use your very Own GPU for the interpolation purpose , make suyre your GPU have Cuda compatibility',
      attachTo: {
        element: '#GPU',
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
      id: 'Play/Pause',
      text: 'Play pause at your own convinience',
      attachTo: {
        element: '#Pause',
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
      id: 'Speed Control',
      text: 'Control the speed of the interpolation',
      attachTo: {
        element: '#IamSPeed',
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
      id: 'Custom Over to test your own overlay',
      text: 'you can also test the Overlay with your own Overlay',
      attachTo: {
        element: '#CustomVid',
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
      id: 'Update',
      text: 'Update the overlay when Interpolation Ends',
      attachTo: {
        element: '#Updater',
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
    // tour.start();

    return () => {
      map.setTarget(null); // Clean up
    };
  }, []);

  // const handleInterpolate = async () => {
  //   const payload = {
  //     frame1: "https://iili.io/2ajXTP9.jpg",
  //     frame2: "https://iili.io/2ajXf8G.jpg",
  //     times_to_interpolate: 6,
  //   };

  //   try {
  //     const response = await axios.post('http://127.0.0.1:5002/interpolate', payload);
  //     // Access the output URL from the response data
  //     setOutputUrl(response.data.output_url);
  //     console.log("Output URL:", response.data.output_url);
  //     if (response.data.output_url) {
  //       const videoUrl = response.data.output_url;
  //       setVideoSrc(videoUrl); // Update the video source dynamically
  //       console.log("Interpolation complete. Video updated:", videoUrl);
  //     } else {
  //       console.error("No video path received in response.");
  //     }
  //   } catch (error) {
  //     console.error("Error during interpolation:", error.response?.data?.error || error.message);
  //   }
  // };

  // const handleClickFAL = async () => {
  //   try {
  //     const response = await axios.post('http://127.0.0.1:5001/run-interpolation', {
  //       frames: [
  //         { url: "https://iili.io/2ajXTP9.jpg" },
  //         { url: "https://iili.io/2ajXf8G.jpg" }
  //       ]
  //     });
  //     console.log('Interpolation Result:', response.data.result.video.url);
  //     setResponseData(response.data); // Store the response data in state
  //     setError(null);
  //     if (response.data.result.video.url) {
  //       const videoUrl = response.data.result.video.url;
  //       setVideoSrc(videoUrl); // Update the video source dynamically
  //       console.log("Interpolation complete. Video updated:", videoUrl);
  //     } else {
  //       console.error("No video path received in response.");
  //     }

  //   } catch (error) {
  //     console.error('Error running interpolation:', error);
  //   }
  // };

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
        setVideoSrc(videoRef.current.src)
      }
    }
  };

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
      setIsLoading(true)
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
    }finally{
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-100 h-[100vh]">
      <div className="flex gap-5 h-full p-2">
        {/* Map */}
        <div className="w-[78%] h-full rounded-3xl overflow-hidden">
          <div
            id="map"
            className="map-container relative z-1 w-full h-full pointer-events-auto"
          />
        </div>
        <div id="zoom" />

        <div className="flex flex-col p-2 gap-5 flex-1 rounded-xl bg-blue-300">
          {/* Search Location */}
          <div className="flex gap-2">
            <Input
              id="searchInput"
              type="text"
              placeholder="Search for a location in India"
            />
            <Button
              id="searchButton"
            >
              Search
            </Button>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col gap-2">
            <p>{'>'}Select Interpolation Type/Method:- </p>
            <Button
              id="Replicate"
              onClick={() => {
                handleInterpolate(setVideoSrc, setOutputUrl,setIsLoading);
              }}
            >
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
                  <style>
    {`
      @keyframes spin {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `}
  </style>
            </div>
              FILM(server side)
            </Button>
            <Button id="FAL"
              onClick={() => {
                handleClickFAL(setVideoSrc, setResponseData, setError,setIsLoading);
              }}
            >
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
              <style>
    {`
      @keyframes spin {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `}
  </style>
            </div>
              FAL(server side)
            </Button>
            <Button id="GPU"
              onClick={handleClickGPU}
            >
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
              FILM(Client Side/GPU)
            </Button>

            <p>{'>'}Overlay controller:- </p>
            <Button id="Pause"
              onClick={togglePlayPause}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              id="IamSPeed"
              onClick={adjustSpeed}
            >
              {playbackRate !== 1.0 ? 'Slow Down' : 'Normal Speed'}
            </Button>
          </div>

          {/* Update overlay video for testing */}
          <div className="space-y-2">
            <p>{'>'}Test your own overlay video:- </p>
            <Input
              id="CustomVid"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
            />
            <Button id="Updater" onClick={() => updateVideo(videoSrc)}>Update Overlay</Button>
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
        </div>
      </div>


      {/* Overlay video */}
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
      </video>
    </div>
  );
}
