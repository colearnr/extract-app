const retext = require('retext')
const intensify = require('retext-intensify')
const nlcstToString = require('nlcst-to-string')
const keywords = require('retext-keywords')
const profanities = require('retext-profanities')
const sentiment = require('retext-sentiment')
const readability = require('retext-readability')
const _ = require('lodash')
const profanitiesList = require('../data/profanities.json')
const profanitiesMap = new Map()
const AnalysisLib = require('./analyse')
const TextAnalyser = new AnalysisLib()

profanitiesList.forEach(v => {
  profanitiesMap.set(v.toLowerCase(), 1)
})

const DEFAULT_OPTIONS = {
  age: 16
}

class NlpAnalysis {
  constructor (options) {
    this.options = {}
    _.merge(this.options, DEFAULT_OPTIONS)
    _.merge(this.options, options)
  }

  intensify (text, callback) {
    retext().use(intensify, this.options).process(text, callback)
  }

  keywords (text, callback) {
    retext().use(keywords, this.options).process(text, function (err, result) {
      let space = result.namespace('retext')
      let klist = space.keywords.map(n => nlcstToString(n.matches[0].node))
      let kplist = space.keyphrases.map(n => n.matches[0].nodes.map(nlcstToString).join(''))
      callback(err, {keywords: klist, keyphrases: kplist})
    })
  }

  profanities (text, callback) {
    retext().use(profanities, this.options).process(text, callback)
  }

  purifyText (bodyContent, text, callback) {
    bodyContent = bodyContent || ''
    text = text || TextAnalyser.strip_tags(bodyContent)
    text.split(/\s/).forEach(w => {
      if (profanitiesMap.get(w.toLowerCase())) {
        bodyContent = bodyContent.replace(new RegExp(w, 'ig'), '*' + w.split('').join('*').replace(/[a-zA-Z0-9]/g, ''))
      }
    })
    callback(null, bodyContent)
  }

  sentiment (text, callback) {
    retext().use(sentiment, this.options).use(function () {
      return function (cst) {
        let overallScore = cst.data
        let paragraphScore = cst.children.map(v => v.data)
        callback(null, {overallScore, paragraphScore, all: cst})
      }
    }).process(text)
  }

  readability (text, callback) {
    retext().use(readability, this.options).process(text, callback)
  }
}

module.exports = NlpAnalysis
