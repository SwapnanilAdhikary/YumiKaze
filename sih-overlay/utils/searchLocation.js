import { Feature } from "ol";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";

export const searchLocation = async (query) => {
  const pointerSource = new VectorSource();

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
