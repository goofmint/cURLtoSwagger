var through = require('through2')
  , split = require('split')

module.exports = stormStream

function stormStream(_stdin, _stdout) {
  var stdout = _stdout || process.stdout
    , stdin = _stdin || process.stdin
    , stream = through.obj(write)

  stdin.pipe(split()).on('data', processData)

  return stream

  function processData(data) {
    var str = data.toString()

    if(str === 'end') {
      return
    }

    try {
      stream.push(JSON.parse(str))
    } catch(err) {
      stream.emit('error', err)
    }
  }

  function write(obj, _, next) {
    try {
      stdout.write(JSON.stringify(obj) + '\nend\n')
    } catch(err) {
      stream.emit('error', err)
    }

    next()
  }
}
