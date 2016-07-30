var EE = require('events').EventEmitter
  , TMP = require('os').tmpdir()
  , path = require('path')
  , fs = require('fs')

var proxyquire = require('proxyquire')
  , through = require('through2')
  , test = require('tape')

var mockProcess = new EE

mockProcess.pid = 1234

var bltStream = proxyquire('../', {
    './lib/process': mockProcess
  , 'storm-stream': getMockStorm
  , '@noCallThru': true
})

var mockStorm

test('handles handshake, creates stream with config', function(t) {
  t.plan(4)

  mockStorm = through.obj(stormWrite)

  var blt = bltStream(createStream)

  blt.once('data', function(data) {
    t.deepEqual(data, {pid: 1234})
    t.ok(fs.existsSync(path.join(TMP, '1234')))

    mockStorm.push({cats: true})
  })

  mockStorm.push({pidDir: TMP, whatever: 'lol'})

  function stormWrite($, _, next) {
    next()
  }

  function createStream(config) {
    t.deepEqual(config, {pidDir: TMP, whatever: 'lol'})

    return through.obj(write)

    function write(obj, _, next) {
      t.deepEqual(obj, {cats: true})

      next()
    }
  }
})

test('handles events', function(t) {
  t.plan(4)

  mockStorm = through.obj(stormWrite)

  var blt = bltStream(createStream)
    , count = 0

  blt.once('data', function() {
    mockStorm.push({id: '123', task: 1, lol: 'lol'})
  })

  mockStorm.push({pidDir: TMP, whatever: 'lol'})

  function stormWrite(obj, _, next) {
    ++count

    // skip first pid write
    if(count === 2) {
      t.deepEqual(
          obj
        , {command: 'emit', anchors: ['123'], task: 1, tuple: ['rofl']}
      )
    }

    if(count === 3) {
      t.deepEqual(obj, {command: 'ack', id: '123'})
    }

    if(count === 4) {
      t.deepEqual(obj, {command: 'fail', id: '123'})
    }

    if(count === 5) {
      t.deepEqual(obj, {command: 'log', msg: 'hi'})
    }

    next()
  }

  function createStream() {
    return through.obj(write)

    function write(obj, _, next) {
      this.push(['rofl', obj])
      this.emit('ack', obj)
      this.emit('fail', obj)
      this.emit('log', 'hi')

      next()
    }
  }
})

test('handles heartbeats', function(t) {
  t.plan(2)

  mockStorm = through.obj(stormWrite)

  var heartBeat = {stream: '__heartbeat'}
    , blt = bltStream(createStream)
    , count = 0

  blt.once('data', function() {
    mockStorm.push(heartBeat)
  })

  mockStorm.push({pidDir: TMP, whatever: 'lol'})

  function stormWrite(obj, _, next) {
    ++count

    // skip first pid write
    if(count === 2) {
      t.deepEqual(obj, {command: 'sync'})
      mockStorm.push(heartBeat)
    }

    if(count === 3) {
      t.deepEqual(obj, {command: 'sync'})
    }

    next()
  }

  function createStream() {
    return through.obj(write)

    function write(obj, _, next) {
      next()
    }
  }
})

function getMockStorm() {
  return mockStorm
}
