const ExtractLib = require('../index')
const vows = require('vows')
const assert = require('assert')

const suite = vows.describe('extract app test suite')
const ExtractApp = new ExtractLib()

suite.addBatch({
  'Check if we can create the app': {
    topic: function () {
      this.callback(null, ExtractApp)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
    }
  },

  'Check if we can process learnbit': {
    topic: function () {
      ExtractApp.processLearnbit(null, {url: 'http://www.bbc.co.uk/news/uk-36833042'}, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj.publisher, 'BBC News')
      assert.ok(obj.text)
      assert.ok(obj.title)
    }
  },

  'Check if we can do quick process learnbit': {
    topic: function () {
      ExtractApp.quickProcess(null, {url: 'http://www.bbc.co.uk/news/uk-36833042'}, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj.publisher, null)
      assert.ok(obj.body)
      assert.ok(obj.title)
    }
  },

  'Check if we can parse bbc news': {
    topic: function () {
      ExtractApp.processUrl('http://www.bbc.co.uk/news/uk-36833042', false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj.publisher, 'BBC News')
      assert.ok(obj.text)
      assert.ok(obj.title)
    }
  },

  'Check if we can parse wiki page': {
    topic: function () {
      ExtractApp.processUrl('https://en.wikipedia.org/wiki/Apple', false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj.lang, 'en')
      assert.ok(obj.text)
      assert.ok(obj.title)
    }
  },

  'Check if we can process embed code': {
    topic: function () {
      ExtractApp.processEmbedCode(`<iframe width="420" height="315" src="https://www.youtube.com/embed/-Nc0wCrkk00" frameborder="0" allowfullscreen></iframe>`, false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj.lang, 'en')
      assert.ok(obj.text)
      assert.ok(obj.title)
    }
  }
}).export(module)
