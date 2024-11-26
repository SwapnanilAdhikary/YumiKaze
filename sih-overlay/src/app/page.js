'use client';
import { useEffect } from 'react';
import Map from 'ol/Map';
import { OSM } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { Overlay, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { fromExtent } from 'ol/geom/Polygon';
import { ZoomSlider } from 'ol/control';

export default function Home() {
  useEffect(() => {
    const container = document.getElementById('inter');

    // Create overlay positioned over India
    const overlay = new Overlay({
      element: container,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      positioning: 'center-center',
      stopEvent: false,
      position: fromLonLat([78.9629, 20.5937]), // Centered over India
    });

    // Initialize the map layers
    const osmLayer = new TileLayer({
      preload: Infinity,
      source: new OSM(),
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature(
            fromExtent([-1000000, 5000000, 3000000, 7000000]) // Example extent
          ),
        ],
      }),
    });

    // Create the map
    const map = new Map({
      target: 'map',
      layers: [osmLayer, vectorLayer],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5,
        //minZoom: 5,
        //maxZoom: 8,
      }),
      overlays: [overlay],
    });

    // Add zoom slider control
    map.addControl(new ZoomSlider());

    const adjustVideoSizeAndPosition = () => {
      const zoom = map.getView().getZoom();
      
      // Update overlay position to center over India
    //   overlay.setPosition(fromLonLat([78.9629, 20.5937]));

      // Set video size based on zoom level
    //   if (zoom > 5) {
    //     Object.assign(container.style, {
    //       width: '100vw',
    //       height: '100vh',
    //       position: 'absolute',
    //       top: '0',
    //       left: '0',
    //     });
    //   } else {
        const scaleFactor = Math.pow(2, zoom - 4);
        const videoWidth = Math.max(300, 750 * scaleFactor); // Minimum width constraint
        const videoHeight = Math.max(200, 500 * scaleFactor); // Minimum height constraint
        console.log(videoWidth)
		console.log(videoHeight)
		console.log(zoom)
        Object.assign(container.style, {
          width: `${videoWidth}px`,
          height: `${videoHeight}px`,
          position: 'relative', // Reset position if not full screen
        });
      };

    // Attach event listener to adjust video size and position on zoom
    map.getView().on('change:resolution', adjustVideoSizeAndPosition);

    // Initial adjustment
    adjustVideoSizeAndPosition();
    const handleKeyPress = (event) => {
      const view = map.getView();
      let currentZoom = view.getZoom();

      if (event.key === '+') {
        view.setZoom(currentZoom + 1); // Zoom in
      } else if (event.key === '-') {
        view.setZoom(currentZoom - 1); // Zoom out
      }
    };

    document.addEventListener('keypress', handleKeyPress);


    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      map.setTarget(null); // Clean up map on component unmount
    };
  }, []);

  return (
    <>
      <div style={{ height: '900px', width: '100%',pointerEvents:'all', }} id="map" className="map-container relative z-1" />
      <video 
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
        <source src="inter2.mp4" type="video/mp4" style={{pointerEvents:'none',}}/>
        Your browser does not support the video tag.
      </video>
    </>
  );
}
