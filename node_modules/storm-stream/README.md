# storm-stream

Duplex stream interface to Storm

## example

```javascript
var stormStream = require('storm-stream')

var stream = stormStream()

stream.on('data', function(data) {
  if(data.stream && data.stream === '__heartbeat') {
    // sync on heartbeat
    stream.write({command: 'sync'})
  }
})
```

## api

`stormStream([inputStream], [outputStream]) -> DuplexStream`

* Accepts optional input and output streams, defaulting to stdin and stdout.
* Talks plain JavaScript objects and handles communication with Storm.

## license

MIT
