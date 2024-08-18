import React, { useEffect } from "react";
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

  return (
    <>
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
    </>
  );
};
