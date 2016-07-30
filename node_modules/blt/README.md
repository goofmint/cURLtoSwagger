# blt

[![Build Status](http://img.shields.io/travis/jarofghosts/blt.svg?style=flat)](https://travis-ci.org/jarofghosts/blt)
[![npm install](http://img.shields.io/npm/dm/blt.svg?style=flat)](https://www.npmjs.org/package/blt)

[Storm](https://storm.apache.org/) Bolts without the overhead.

## Example

```javascript
var through = require('through2')
  , createBolt = require('blt')

createBolt(splitSentence)

function splitSentence(configuration) {
  var splitStream = through.obj(splitWords)

  return splitStream

  function splitWords(obj, _, next) {
    obj.tuple[0].split(' ').forEach(function(word) {
      splitStream.push([word, obj])
    })

    splitStream.emit('ack', obj)

    next()
  }
}
```

## API

`blt(createStream)`

* `createStream` is a function that can be called with a configuration object
  and returns a Transform Stream.
* `blt` will write tuple objects directly to the returned stream, and it is
  expected to stream arrays of form: `[data, tuple]`, where `data` is the data
  to emit, and `tuple` is the Storm tuple that it is anchored to.

## Events

* When your stream emits data, `blt` emits the data packaged up in Storm's tuple
  format with all of the applicable anchoring data.
* If your stream emits a "log" event with an argument, `blt` passes it along to
  Storm as a "log" event with `msg`.
* If your stream emits a "fail" event with the relevant tuple, `blt` will "fail"
  for you.
* If your stream emits an "ack" event with the relevant tuple, `blt` will "ack"
  for you.

## Usage

`blt` handles all of the Storm-specific aspects of constructing Bolt streams for
Storm.

* Creates PID file and handshakes with Storm at startup.
* Handles responding to heartbeats.

## Notes

* This is experimental and relatively untested, use at your own risk!
* This module is somewhat optimized for a simplified use-case, if you need more,
  try [storm-stream](http://npm.im/storm-stream) or
  [node-storm](http://npm.im/node-storm).
* For a more magical approach, check out [garlic](http://npm.im/garlic).

## License

MIT
