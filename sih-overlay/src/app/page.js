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
import { handleClickFAL, handleInterpolate } from '../../utils/interpolationServer';
import ImageLayer from 'ol/layer/Image';
import ImageStaticSource from 'ol/source/ImageStatic';
import { transformExtent } from 'ol/proj';
import DragBox from 'ol/interaction/DragBox.js';

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
  const [selectedExtent, setSelectedExtent] = useState(null);
  const [videoElem, setVideoElem] = useState(null);

  const [hoBaseLayer, setHoBaseLayer] = useState(null);
  const [hoMap, setHoMap] = useState(null);
  const [hoBbox, setHoBbox] = useState(['73.98', '10.70', '79.96','17.80']);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  console.log(startTime, endTime)

  // Function to round a date to the nearest 30-minute interval
  const roundToNearest30Minutes = (date) => {
    const minutes = date.getMinutes();
    const remainder = minutes % 30;
    date.setMinutes(minutes - remainder + (remainder === 0 ? 30 : 0));
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  // Function to handle start time change
  const handleStartTimeChange = (event) => {
    const newStartTime = event.target.value;
    setStartTime(newStartTime);

    // Calculate end time as 30 minutes after the start time
    const startDate = new Date(newStartTime);
    if (!isNaN(startDate)) {
      let endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30); // Add a 30-minute gap

      // Round the end time to the nearest 30-minute mark
      endDate = roundToNearest30Minutes(endDate);
      setEndTime(endDate.toISOString().slice(0, 16)); // Format to the correct format
    }
  };

  // Function to handle end time change
  const handleEndTimeChange = (event) => {
    const newEndTime = event.target.value;
    setEndTime(newEndTime);

    const startDate = new Date(startTime);
    const endDate = new Date(newEndTime);

    if (isNaN(startDate) || isNaN(endDate)) return; // If the dates are invalid, return early

    const diffMinutes = (endDate - startDate) / 60000; // Difference in minutes

    // Check if the difference is a multiple of 30 minutes
    if (diffMinutes % 30 !== 0) {
      alert('The end time must be a multiple of 30 minutes after the start time.');
    }
  };

  function showAnimLayer(inputVideoWebm, inputVideoMp, bbox, map, playbackRate, showSeconds_, videoOpacity, legend) {
    /****************************************************
  This function creates the folowing globals:
  video;
  videoControl;
  showSeconds;
  postcomposeKey;
  animInterval;

  the video with function removeAnimLayer()
  *****************************************************/
    /****************************************************

  *****************************************************/
    // removeAnimLayer(map);
    console.log("original:- ",bbox)
    var extents = transformExtent([parseFloat(bbox[0]), parseFloat(bbox[1]), parseFloat(bbox[2]), parseFloat(bbox[3])], 'EPSG:4326', 'EPSG:3857');
    var corners = [
      [extents[0], extents[3]],
      [extents[2], extents[3]],
      [extents[2], extents[1]],
      [extents[0], extents[1]]
    ];
    var baseLayer = new ImageLayer({
      name: 'blankLayer',
      source: new ImageStaticSource({
        url: 'img/blanklayer.png',
        projection: map.getView().getProjection(),
        imageExtent: extents,
      })
    });
    /**************************************
  Setting video as a global

  ***************************************/
    const video = document.createElement('video');
    setVideoElem(video);
    video.setAttribute("id", "videoElement");
    video.muted = 'muted';
    video.crossOrigin = 'Anonymous';
    var inputVideo = [
      [inputVideoWebm, 'video/webm'],
      [inputVideoMp, 'video/mp4'],
    ];
    for (var i = 0; i < inputVideo.length; i++) {
      var source = document.createElement('source');
      source.src = inputVideo[i][0];
      source.type = inputVideo[i][1];
      video.appendChild(source);
    }
    /*******************************
  Video Events
    *******************************/
    if (typeof (playbackRate) == 'undefined' || playbackRate == null) {
      video.playbackRate = 1;
    } else {
      video.playbackRate = playbackRate;
    }
    video.addEventListener('ended', function () {
      this.currentTime = 0;
      this.play();
    }, false);

    /***************************************
     start playing and change
      the duration of the video the video
      after the video is loaded.
    ****************************************/
    video.addEventListener('loadeddata', function () {
      videoInitialPlay();

      function videoInitialPlay() {
        video.currentTime = 0;
        video.play();
      }
      /*************************************************************************
         global variable showSeconds,  to controll
        the video according to the seconds
        If showSeconds_      ***************************************************************************/
      // if (typeof (showSeconds_) == 'undefined' || showSeconds_ == null || showSeconds_ == 'all') {
      //   showSeconds = video.duration;
      // } else {
      //   showSeconds = showSeconds_;
      // }
    }, false);

    var topLeft = corners[0];
    var topRight = corners[1];
    var bottomRight = corners[2];
    var height = topRight[1] - bottomRight[1];
    var width = topRight[0] - topLeft[0];
    /***************************************
      Video rotation
    ****************************************/
    var dx = width;
    var dy = topLeft[1] - topRight[1];
    var rotation = Math.atan2(dy, dx);
    /***************************************
       add the video to OL
      using canvas and  the postcomposeKey
      as a global.
    ****************************************/
    if (typeof (videoOpacity) == 'undefined' || videoOpacity == null) {
      videoOpacity = 0.5;
    }
    const postcomposeKey = baseLayer.on('postrender', function (event) {
      var frameState = event.frameState;
      var resolution = frameState.viewState.resolution;
      var origin = map.getPixelFromCoordinate(topLeft);
      var context = event.context;
      context.save();
      context.scale(frameState.pixelRatio, frameState.pixelRatio);
      context.translate(origin[0], origin[1]);
      context.rotate(rotation);
      context.globalAlpha = videoOpacity;
      context.drawImage(video, 0, 0, width / resolution, height / resolution);
      context.restore();
    });
    map.addLayer(baseLayer);
    /***************************************************************
     setInterval() method.
    Map will be rendered 10 times per second.
    **************************************************************/
    const animInterval = setInterval(function () {
      map.render();
    }, 1000 / 10);

    setHoBaseLayer(baseLayer);
  }

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
      fromLonLat([78.9629, 20.5937])[1] - 1300000,
      fromLonLat([78.9629, 20.5937])[0] + 2000000,
      fromLonLat([78.9629, 20.5937])[1] + 1500000,
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
      // overlays: [overlay],
    });

    // DragBox interaction for selecting extents
    const dragBox = new DragBox({
      condition: (event) => true,
    });

    dragBox.on('boxend', () => {
      const extent = dragBox.getGeometry().getExtent();
      setSelectedExtent(extent);
      console.log('Selected Extent:', extent);

      const [minX, minY, maxX, maxY] = extent;
      const [minLon, minLat] = fromLonLat([extent[0], extent[1]]);
      const [maxLon, maxLat] = fromLonLat([extent[2], extent[3]]);
      console.log('Selected Extent (LonLat):', [minLon, minLat, maxLon, maxLat]);

      // Convert to latitude/longitude (EPSG:4326)
      const minCoordinates = toLonLat([minX, minY]);
      const maxCoordinates = toLonLat([maxX, maxY]);

      setHoBbox([`${minCoordinates[1]}`, `${minCoordinates[0]}`, `${maxCoordinates[1]}`, `${maxCoordinates[0]}`])

      // Log the coordinates
      console.log('Bottom-left Corner (Lat/Lon):', minCoordinates);
      console.log('Top-right Corner (Lat/Lon):', maxCoordinates);

      // Zoom to the selected extent
      map.getView().fit(extent, { duration: 1000 }); // Smooth zoom animation
    });

    dragBox.on('boxstart', () => {
      // Optionally clear previous selections or perform other actions
    });

    map.addInteraction(dragBox);

    const zoomSlider = new ZoomSlider({

    });
    map.addControl(zoomSlider);
    //newly added

    var legend = ["2017-07-22T00:00:00Z", "2017-07-22T01:00:00Z", "2017-07-22T02:00:00Z", "2017-07-22T03:00:00Z", "2017-07-22T04:00:00Z", "2017-07-22T05:00:00Z", "2017-07-22T06:00:00Z", "2017-07-22T07:00:00Z", "2017-07-22T08:00:00Z", "2017-07-22T09:00:00Z", "2017-07-22T10:00:00Z", "2017-07-22T11:00:00Z", "2017-07-22T12:00:00Z", "2017-07-22T13:00:00Z", "2017-07-22T14:00:00Z", "2017-07-22T15:00:00Z", "2017-07-22T16:00:00Z", "2017-07-22T17:00:00Z", "2017-07-22T18:00:00Z", "2017-07-22T19:00:00Z", "2017-07-22T20:00:00Z", "2017-07-22T21:00:00Z", "2017-07-22T22:00:00Z", "2017-07-22T23:00:00Z", "2017-07-23T00:00:00Z", "2017-07-23T01:00:00Z", "2017-07-23T02:00:00Z", "2017-07-23T03:00:00Z", "2017-07-23T04:00:00Z", "2017-07-23T05:00:00Z", "2017-07-23T06:00:00Z", "2017-07-23T07:00:00Z", "2017-07-23T08:00:00Z", "2017-07-23T09:00:00Z", "2017-07-23T10:00:00Z", "2017-07-23T11:00:00Z", "2017-07-23T12:00:00Z", "2017-07-23T13:00:00Z", "2017-07-23T14:00:00Z", "2017-07-23T15:00:00Z", "2017-07-23T16:00:00Z", "2017-07-23T17:00:00Z", "2017-07-23T18:00:00Z", "2017-07-23T19:00:00Z", "2017-07-23T20:00:00Z", "2017-07-23T21:00:00Z", "2017-07-23T22:00:00Z", "2017-07-23T23:00:00Z"];
    var bbox = ["48.116", "6.554", "107.395", "35.674"];
    var framerate = 1;
    var showSeconds = 'all';
    var opacity = 0.5;
    showAnimLayer('/test.mp4', '/test.webm', bbox, map, framerate, showSeconds, opacity, legend);



    //added new


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

    setHoMap(map);

    return () => {
      map.setTarget(null); // Clean up
    };
  }, []);

  const togglePlayPause = () => {
    if (videoElem) {
      if (isPlaying) {
        videoElem.pause();
      } else {
        videoElem.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const [playbackRate, setPlaybackRate] = useState(1.0);

  const adjustSpeed = () => {
    if (videoElem) {
      const newRate = playbackRate === 1.0 ? 0.5 : 1.0;
      videoElem.playbackRate = newRate;
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
    } finally {
      setIsLoading(false);
    }
  };

  function videoUpdateFunc() {
    hoMap.removeLayer(hoBaseLayer);
    var legend = ["2017-07-22T00:00:00Z", "2017-07-22T01:00:00Z", "2017-07-22T02:00:00Z", "2017-07-22T03:00:00Z", "2017-07-22T04:00:00Z", "2017-07-22T05:00:00Z", "2017-07-22T06:00:00Z", "2017-07-22T07:00:00Z", "2017-07-22T08:00:00Z", "2017-07-22T09:00:00Z", "2017-07-22T10:00:00Z", "2017-07-22T11:00:00Z", "2017-07-22T12:00:00Z", "2017-07-22T13:00:00Z", "2017-07-22T14:00:00Z", "2017-07-22T15:00:00Z", "2017-07-22T16:00:00Z", "2017-07-22T17:00:00Z", "2017-07-22T18:00:00Z", "2017-07-22T19:00:00Z", "2017-07-22T20:00:00Z", "2017-07-22T21:00:00Z", "2017-07-22T22:00:00Z", "2017-07-22T23:00:00Z", "2017-07-23T00:00:00Z", "2017-07-23T01:00:00Z", "2017-07-23T02:00:00Z", "2017-07-23T03:00:00Z", "2017-07-23T04:00:00Z", "2017-07-23T05:00:00Z", "2017-07-23T06:00:00Z", "2017-07-23T07:00:00Z", "2017-07-23T08:00:00Z", "2017-07-23T09:00:00Z", "2017-07-23T10:00:00Z", "2017-07-23T11:00:00Z", "2017-07-23T12:00:00Z", "2017-07-23T13:00:00Z", "2017-07-23T14:00:00Z", "2017-07-23T15:00:00Z", "2017-07-23T16:00:00Z", "2017-07-23T17:00:00Z", "2017-07-23T18:00:00Z", "2017-07-23T19:00:00Z", "2017-07-23T20:00:00Z", "2017-07-23T21:00:00Z", "2017-07-23T22:00:00Z", "2017-07-23T23:00:00Z"];
    console.log(hoBbox)
    showAnimLayer('/test2.webm', '/test2.webm', hoBbox, hoMap, 1, 'all', 0.5, legend);
  }

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
                handleInterpolate(setVideoSrc, setOutputUrl, setIsLoading);
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
                handleClickFAL(setVideoSrc, setResponseData, setError, setIsLoading);
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
              onClick={videoUpdateFunc}
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
              {playbackRate === 1.0 ? 'Slow Down' : 'Normal Speed'}
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

          <div>
            <div>
              <label htmlFor="start-time">Select Start Date and Time:</label>
              <input
                type="datetime-local"
                id="start-time"
                name="start-time"
                value={startTime}
                onChange={handleStartTimeChange}
              />
            </div>
            <div>
              <label htmlFor="end-time">Select End Date and Time:</label>
              <input
                type="datetime-local"
                id="end-time"
                name="end-time"
                value={endTime}
                onChange={handleEndTimeChange}
              />
            </div>
          </div>
        </div>
      </div>


      {/* Overlay video */}
    </div>
  );
}
