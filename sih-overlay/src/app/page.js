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
import Film from '../../utils/FILM Server';
import FAL from '../../utils/FAL server';
import GPU from '../../utils/GPU';
import { FastForward } from 'lucide-react';

async function moveFile(cnt) {
  try {
    const response = await fetch("api/interpolatedApi", {
      // Ensure the path is correct
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cnt }), // Send the count in the request body
    });

    const data = await response.json();

    if (response.ok) {
      console.log("File moved successfully:", data.message);
      return true;
    } else {
      console.error("Error:", data.error);
      return false;
    }
  } catch (err) {
    console.error("Request failed:", err);
    return false;
  }
}

export default function Home() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true); 
  const [videoSrc, setVideoSrc] = useState('test.webm');
  // runway api => test.mp4 file -> replace with previous test.mp4
 let cnt = 1;

 // Use setInterval to run the function every 2 seconds
 const interval = setInterval(() => {
   console.log("Test running ", cnt);
   const success = moveFile(cnt);
   if(!success) console.log("Fuck yrr kaam nhi kr rha!!!")
   cnt++; // Increment the count

   // Optional: Stop after a certain number of iterations (for testing purposes)
   if (cnt > 3) {
     // Stop after 5 iterations
     clearInterval(interval); // Stop the interval
     console.log("Finished moving files.");
   }
 }, 2000);

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
      for (let x = minX; x <= maxX; x += 1000000) { // Adjust spacing as needed
        features.push(new Feature(new LineString([[x, minY], [x, maxY]])));
      }
      for (let y = minY; y <= maxY; y += 1000000) {
        features.push(new Feature(new LineString([[minX, y], [maxX, y]])));
      }
      return features;
    };

    const extent = [fromLonLat([78.9629, 20.5937])[0] - 5000000, 
                        fromLonLat([78.9629, 20.5937])[1] - 5000000,
                        fromLonLat([78.9629, 20.5937])[0] + 5000000,
                        fromLonLat([78.9629, 20.5937])[1] + 5000000];
    
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
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`
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

    return () => {
      map.setTarget(null); // Clean 
    };
  }, []);

  const FilmClick = () => {
    Film();
  };

  const FalClick = () => {
    FAL();
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
      <Button style={{ padding: '5px', background: 'black', color: 'white', borderRadius: '5px'  }}
        onClick={FilmClick}
      >
        FILM(server side)
      </Button>
      <Button style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={FalClick}
      >
        FAL(server side)
      </Button>
      <Button style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={GPUClick}
      >
        FILM(Client Side/GPU)
      </Button>
      <Button style={{ padding: '10px', background: 'black', color: 'white', borderRadius: '5px' }}
        onClick={togglePlayPause}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
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
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ padding: '15px', cursor: 'pointer' }}
      />
    </div>

    <video
      ref={videoRef} 
      id='inter'
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
    >
      <source src="test.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
  </>
);
}