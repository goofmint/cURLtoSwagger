var proxyquire = require('proxyquire')
  , through = require('through2')
  , test = require('tape')

var garlicStream

var garlic = proxyquire('../', {
    'blt': getMockBlt
})

test('does not throw', function(t) {
  t.plan(1)

  t.doesNotThrow(function() {
    garlic(Function())
  })
})

test('translates stream events into blt events', function(t) {
  t.plan(3)

  var fakeStream = through.obj(write)
    , fakeTuple = {tuple: true}

  garlic(makeFakeStream)

  garlicStream.on('data', function(data) {
    t.deepEqual(data, ['rofl', fakeTuple])
  })

  garlicStream.on('ack', function(tuple) {
    t.deepEqual(tuple, fakeTuple)
  })

  garlicStream.on('log', function(message) {
    t.equal(message, 'lolcano')

    fakeStream.end()
  })

  garlicStream.write(fakeTuple)

  function write(data, _, next) {
    this.push('rofl')
    this.emit('log', 'lolcano')

    next()
  }

  function makeFakeStream() {
    return fakeStream
  }
})

test('emits fail on error and destroys', function(t) {
  t.plan(1)

  var fakeStream = through.obj(write)
    , fakeTuple = {tuple: true}

  garlic(makeFakeStream)

  garlicStream.on('data', function() {
    t.fail()
  })

  garlicStream.on('ack', function() {
    t.fail()
  })

  garlicStream.on('log', function() {
    t.fail()
  })

  garlicStream.on('fail', function(tuple) {
    t.deepEqual(tuple, fakeTuple)
  })

  garlicStream.write(fakeTuple)

  function write(data, _, next) {
    this.emit('error', new Error('wutever'))
    this.push('rofl')
    this.emit('log', 'lolcano')

    next()
  }

  function makeFakeStream() {
    return fakeStream
  }
})

function getMockBlt(fn) {
  garlicStream = fn()
}
