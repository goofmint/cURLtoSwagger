var through = require('through2')
  , test = require('tape')

var stormStream = require('../')

test('writes in proper format to stdout', function(t) {
  t.plan(1)

  var stdout = through()
    , stdin = through()

  var stream = stormStream(stdin, stdout)
    , data = {cats: true}

  stdout.once('data', function(output) {
    t.equal(output.toString(), JSON.stringify(data) + '\nend\n')
  })

  stream.write(data)
})

test('emits data from stdin, drops end statements', function(t) {
  t.plan(2)

  var stdout = through()
    , stdin = through()

  var stream = stormStream(stdin, stdout)
    , data = {cats: true}

  stream.on('data', function(output) {
    t.deepEqual(output, data)
  })

  stdin.write(JSON.stringify(data) + '\nend\n')
  stdin.write(JSON.stringify(data) + '\nend\n')
})

test('emits error on write error', function(t) {
  t.plan(1)

  var stdout = through()
    , stdin = through()

  var stream = stormStream(stdin, stdout)
    , o = {}

  stream.on('error', function(err) {
    t.ok(err)
  })

  // trigger stringify error
  o.o = o

  stream.write(o)
})

test('emits error on read error', function(t) {
  t.plan(1)

  var stdout = through()
    , stdin = through()

  var stream = stormStream(stdin, stdout)

  stream.on('error', function(err) {
    t.ok(err)
  })

  // trigger parse error
  stdin.write('{"lol":!\n')
})
