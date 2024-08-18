import React, { useEffect, useState } from "react";
import { Protocol } from "pmtiles";
import Map from "react-map-gl/maplibre";
import maplibregl, { LayerSpecification } from "maplibre-gl";
import layers from "protomaps-themes-base";

export const MapComponent = () => {

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);


  const [swLoaded, setSwLoaded] = useState(true);
  
  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  useEffect(() => {
    const checkServiceWorker = async () => {
      try {
        const response = await fetch('/checkSw');
        console.log(response);
        console.log(response.headers.get('X-Sw-Tag'))

        // Check if the response status is 202 and the X-Sw-Tag header is present
        if (response.status === 202 && response.headers.get('X-Sw-Tag') === 'Served by Service Worker') {
          console.log('Service worker is active');
          setSwLoaded(true);
        } else {
          console.log('Service worker is not active, reloading the page...');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error checking service worker:', error);
        window.location.reload(); // Reload the page in case of an error
      }
    };

    checkServiceWorker();
  }, []);

  useEffect(()=> {
    if ('serviceWorker' in navigator) {
      console.log('registering service worker')
      navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
              console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
              console.log('Service Worker registration failed:', error);
          });
    }
  }, []);

  return (
    <>
      {
        swLoaded ?
        <Map
        initialViewState={{
          longitude: -74.006,
          latitude: 40.7128,
          zoom: 9,
        }}
        mapStyle={{
          version: 8,
          sources: {
            protomaps: {
              type: "vector",
              url: "pmtiles:///world.pmtiles",
              maxzoom: 5,
            },
            protomaps2: {
              type: "vector",
              url: "pmtiles:///nyc.pmtiles",
            }
          },
          glyphs:
            "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
          layers: [
            ...layers(
              "protomaps",
              "light",
            ).filter((e) => {
              return !e.id.includes("background");
            }),
            ...layers(
              "protomaps2",
              "light",
            ).filter((e) => {
              return !e.id.includes("background");
            }).map((e) => {
              return {
                ...e,
                id: `${e.id}-2`
              };
            }),
          ],
        }}
        attributionControl={false}
      >
        <div style={{
          position: "absolute",
          bottom: 0,
          left:0,
          backgroundColor: "white",
          padding: "5px",
          borderRadius: "5px",
          margin: "5px",
        }}>
          MapLibre | OpenStreetMap contributors | Protomaps
        </div>
      </Map>
      :
      <div>
        <h1>Service Worker is not active</h1>
        <p>Reloading the page...</p>
      </div>
      }
    </>
  );
};
