# Static Protomaps on Cloudflare Pages

This is a sample project to demonstrate how to host Protomaps on Cloudflare Pages using only static .pmtiles files.

This is an exploration of how to host Protomaps on Cloudflare Pages without needing to host a separate Workers and R2 bucket. The official method to hose Protomaps on Cloudflare is following this GitHub: https://github.com/thomasgauvin/protomaps-on-cloudflare.

## How it works 

This project is made up of one React application, that intercepts HTTP Range Requests with Service Workers to cached static files.

1. The MapLibre library makes a HTTP Range Request for an area of the map.
2. The service worker intercepts the request and responds to it from bytes of a cached static .pmtiles file. 
