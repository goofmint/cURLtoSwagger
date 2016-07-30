# garlic

[![Build Status](http://img.shields.io/travis/jarofghosts/garlic.svg?style=flat)](https://travis-ci.org/jarofghosts/garlic)
[![npm install](http://img.shields.io/npm/dm/garlic.svg?style=flat)](https://www.npmjs.org/package/garlic)

Adds a little bit of magic to your [blt](http://npm.im/blt)

## example

```javascript
var through = require('through2')
  , garlic = require('garlic')

garlic(splitSentence)

function splitSentence() {
  return through(function(words, _, next) {
    var self = this

    words.split(' ').forEach(function(word) {
      self.push(word)
    })

    next()
  })
}
```

## api

`garlic(createStream)`

* `createStream` is a function that returns a stream. This function will be
  called for *every tuple*, and the returned stream will be used as the sole
  means of processing the data from that tuple.

## notes

`garlic` handles anchoring your data-processing events, allowing you to write or
use regular node streams as a Bolt in an Apache Storm Topology.

**This is incredibly experimental and magical and untested. Tread lightly**

## license

MIT
