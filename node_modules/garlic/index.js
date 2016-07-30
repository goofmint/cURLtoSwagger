var through = require('through2')
  , blt = require('blt')

module.exports = garlic

function garlic(createStream) {
  var bltStream = blt(setup)

  return bltStream

  function setup() {
    var garlicStream = through.obj(factory)

    return garlicStream

    function factory(tuple, _, next) {
      var stream = createStream(tuple)

      stream.on('data', onData)
      stream.on('error', onError)
      stream.on('end', onEnd)
      stream.on('log', onLog)

      stream.write(tuple.tuple[tuple.tuple.length - 1])
      stream.end()

      next()

      function cleanup() {
        stream.removeListener('data', onData)
        stream.removeListener('error', onError)
        stream.removeListener('end', onEnd)
        stream.removeListener('log', onLog)
      }

      function onData(data) {
        garlicStream.push([data, tuple])
      }

      function onError() {
        garlicStream.emit('fail', tuple)
        cleanup()

        if(stream.destroy) {
          stream.destroy()
        }
      }

      function onEnd() {
        garlicStream.emit('ack', tuple)
        cleanup()
      }

      function onLog(message) {
        garlicStream.emit('log', message)
      }
    }
  }
}
