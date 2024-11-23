'use client';
import { useEffect } from 'react';
import Map from 'ol/Map';
import { OSM } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { Overlay, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import {Vector as VectorSource} from 'ol/source.js';
import {fromExtent} from 'ol/geom/Polygon.js';
import {ZoomSlider} from 'ol/control.js';

export default function Home() {

  useEffect(() => {
		const container = document.getElementById('inter');

		const overlay = new Overlay({
			element: container,
			autoPan: {
				animation: {
					duration: 250,
				},
			},
      positioning: 'center-center',
      stopEvent: true,
      position: fromLonLat([28.9629, 23.5937]),
	 
		});

		const osmLayer = new TileLayer({
			preload: Infinity,
			source: new OSM(),
		});
		const vectorLayer = new VectorLayer({
			source: new VectorSource({
			  features: [
				new Feature(
				  // Here a `Geometry` is expected, e.g. a `Polygon`, which has a handy function to create a rectangle from bbox coordinates
				  fromExtent([-1000000, 5000000, 3000000, 7000000]), // minX, minY, maxX, maxY
				)
			]
		}
	)
}
		)

		const map = new Map({
			target: 'map', 
			layers: [osmLayer,vectorLayer], 
			view: new View({
				center: fromLonLat([78.9629, 20.5937]), 
				zoom: 5, 
			}),
			overlays: [overlay],
		});
		// map.getView().setMinZoom(5);
		const zoomslider = new ZoomSlider();
		map.addControl(zoomslider);
		// map.getView().setMaxZoom(8);
		const adjustVideoSize = () => {
			const zoom = map.getView().getZoom();
			console.log(zoom)
			const scaleFactor = zoom ? Math.pow(2, zoom - 4) : 1; // Adjust scale factor as needed
			console.log(scaleFactor)
			const videoWidth = 750 * scaleFactor;
			const videoHeight = 500 * scaleFactor;
			console.log(videoHeight)
			console.log(videoWidth)
	  
			container.style.width = `${videoWidth}px`;
			container.style.height = `${videoHeight}px`;
			// container.style.transform = `translate(-${videoWidth / 2}px, -${videoHeight / 2}px)`; // Center the video
		  };
	  
		  // Attach event listener to adjust video size on zoom
		  map.getView().on('change:resolution', adjustVideoSize);
	  
		  // Initial adjustment
		  adjustVideoSize();
		

		return () => map.setTarget(null); // Clean up map on component unmount
	}, []);



	return (
		<>
			<div
				style={{ height: '900px', width: '100%' }}
				id="map"
				className="map-container relativ z-1"
			/>
			<video id='inter' className='opacity-100 scale-x-75' width="750" height="500" style={{pointerEvents: 'none'}} >
				<source src="inter2.mp4" type="video/mp4" />
			</video>
		</>
	);
}
