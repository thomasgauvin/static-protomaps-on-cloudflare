// service-worker.js
self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
    event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('fetch', event => {
    const request = event.request;
    console.log("Handling network request for: ", request.url);
    console.log((new URL(request.url)).pathname)

    if((new URL(request.url)).pathname === "/checkSw"){
        console.log("returning A-OK")
        return event.respondWith(new Response("A-OK", {
            status: 202, // Use 200 to indicate successful response
            headers: {
                'Content-Type': 'text/plain', // Set appropriate content type
                'X-Sw-Tag': 'Served by Service Worker'
            }
        }));
    }
    if ((new URL(request.url)).pathname !== "/world.pmtiles") {
        console.log("got a request for world.pmtiles")
        return event.respondWith(fetch(request));
    }

    event.respondWith(handleRangeRequest(request));
});

async function fetchPmtilesFile(path) {
    const cache = await caches.open("pmtiles-file-cache");
    const cachedResponse = await cache.match(path);

    if (cachedResponse) {
        return cachedResponse.arrayBuffer();
    }

    console.log("Fetching from network");
    const response = await fetch(path);
    const responseClone = response.clone()
    const responseBuffer = await response.arrayBuffer();

    try {
        await cache.put(path, responseClone);
    } catch (e) {
        console.log("Problem writing to cache: ", e);
    }

    return responseBuffer;
}


const chunkSize = 10 * 1024 * 1024; // 10MB in bytes

function getFilePathsFromRange(path,range){
    const start = parseInt(range[1], 10);
    const end = range[2] ? parseInt(range[2], 10) : pmtilesFile.byteLength - 1;

    const firstFileIndex = Math.floor(start / chunkSize);
    const lastFileIndex = Math.floor(end / chunkSize);

    let chunkFilePaths = [];
    //from the first file to the last file, inclusive
    //return an array of file paths (file paths are first byte - last byte, where the index represents the multiple of the chunk size)  
    for (let i = firstFileIndex; i <= lastFileIndex; i++) {
        const startByte = i * chunkSize;
        const endByte = startByte + chunkSize - 1;
        const filePath = `${path}/${startByte}-${endByte}.bin`;
        chunkFilePaths.push(filePath);
    }

    return chunkFilePaths;
}

var _appendBuffer = function(buffer1, buffer2) {
    console.log(buffer1.byteLength)
    console.log(buffer2.byteLength)
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  };

async function handleRangeRequest(request) {
    //this is the folder name. by convention, the pmtiles file will be the name of the folder
    const path = (new URL(request.url)).pathname;
    const fileByteLength = 1080033279; //hardcoded for now

    const rangeHeader = request.headers.get('Range');
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    console.log("rangeMatch: ", rangeMatch);
    console.log("rangeEnd: ", parseInt(rangeMatch[2],10));
    console.log("chunkSize: ", chunkSize);
    console.log("fileByteLength: ", fileByteLength);
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);

    const chunkFilePaths = getFilePathsFromRange(path,rangeMatch);

    console.log("rangeMatch: ", rangeMatch);
    console.log("rangeHeader: ", rangeHeader);
    console.log(chunkFilePaths);

    const pmtilesChunkFiles = [];
    for (let i = 0; i < chunkFilePaths.length; i++) {
        const chunkFile = await fetchPmtilesFile(chunkFilePaths[i]);
        pmtilesChunkFiles.push(chunkFile);
    }

    let chunkStart = start % chunkSize;
    let chunkEnd = end % chunkSize;

    console.log("start: ", start);
    console.log("end: ", end);

    console.log("chunkStart: ", chunkStart);
    console.log("chunkEnd: ", chunkEnd);

    let chunk = new Uint8Array(0);
    for (let i = 0; i < pmtilesChunkFiles.length; i++) {
        //add to the chunk either the entire file or the part of the file that is requested
        //if it is the first file, only add the part of the file that is requested
        //if it is the last file, only add the part of the file that is requested
        //if it is a file in between, add the entire file
        if (i === 0) {
            console.log(i);
            console.log('reading first file')


            chunkEnd = chunkEnd > chunkSize ? chunkSize - 1 : chunkEnd;
            
            console.log(chunkStart)
            console.log(chunkEnd)

            const tempChunk = pmtilesChunkFiles[i].slice(chunkStart, chunkEnd + 1);
            console.log('tempChunk')
            console.log(tempChunk.byteLength)
            chunk = _appendBuffer(chunk, pmtilesChunkFiles[i].slice(chunkStart, chunkEnd + 1));
        }
        else if (i === pmtilesChunkFiles.length - 1) {
            chunkStart = 0;

            console.log('reading last file')

            chunk = _appendBuffer(chunk, pmtilesChunkFiles[i].slice(chunkStart, chunkEnd + 1));
        }
        else {
            console.log('reading middle file')

            chunk = _appendBuffer(chunk, pmtilesChunkFiles[i]);
        }
    }

    const byteSize = chunk.length;

    if (rangeHeader) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileByteLength - 1;

        console.log(`Returning bytes ${start}-${end}/${fileByteLength}`);
        console.log(`Bytes should be ${Math.floor(start/chunkSize)}-${Math.floor(end/chunkSize)}`);
        console.log(`Bytes should be ${start%chunkSize}-${end%chunkSize}`);
        console.log(`Bytes should be ${Math.floor(end%chunkSize) - Math.floor(start%chunkSize)}`);
        console.log('chunk length')
        console.log(chunk.byteLength)
        // chunk = pmtilesChunkFiles[0].slice(start, end + 1);

        return new Response(chunk, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': byteSize,
                'Content-Range': `bytes ${start}-${end}/${fileByteLength}`,
                'X-Sw-Tag': 'Served by Service Worker'
            }
        });
    }

    // If no Range header, return the entire file
    return new Response(pmtilesFile, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': pmtilesFile.byteLength
        }
    });
}
