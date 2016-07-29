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
const profanitiesPhrasesMap = new Map()
const AnalysisLib = require('./analyse')
const TextAnalyser = new AnalysisLib()

profanitiesList.forEach(v => {
  if (v.indexOf(' ') !== -1) {
    profanitiesPhrasesMap.set(v.toLowerCase(), 1)
  } else {
    profanitiesMap.set(v.toLowerCase(), 1)
  }
})

const DEFAULT_OPTIONS = {
  age: 16
}

const FILLER_WORDS = ['a', 'an', 'the', 'blah', 'hmm', 'foo', '<br>', '&nbsp;', 'ok', 'oh',
    'is', 'was', 'he', 'she', 'them', 'they', 'their', 'his', 'hers', 'http', 'https', 'colearnr', 'title', 'topic']

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
      klist = klist.filter(w => FILLER_WORDS.indexOf(w) === -1)
      kplist = kplist.filter(w => FILLER_WORDS.indexOf(w) === -1)
      callback(err, {keywords: klist, keyphrases: kplist})
    })
  }

  profanities (text, callback) {
    retext().use(profanities, this.options).process(text, callback)
  }

  purifyText (bodyContent, text, callback) {
    bodyContent = bodyContent || ''
    text = text || TextAnalyser.strip_tags(text)
    text = text.replace(/[.!%^&*\\|~=`{}\[\]\'<>\/]/g, ' ').toLowerCase()
    text.split(' ').forEach(w => {
      w = w.trim()
      if (profanitiesMap.get(w)) {
        bodyContent = bodyContent.replace(new RegExp('\\b' + w + '\\b', 'ig'), '*' + w.split('').join('*').replace(/[a-zA-Z0-9]/g, ''))
      }
    })
    // Clean phrases
    profanitiesPhrasesMap.forEach((v, w) => {
      bodyContent = bodyContent.replace(new RegExp(w, 'ig'), '*' + w.split('').join('*').replace(/[a-zA-Z0-9]/g, ''))
    })
    callback(null, bodyContent)
  }

  removeFillers (text) {
    text = TextAnalyser.strip_tags(text)
    FILLER_WORDS.forEach(w => {
      text = text.replace(new RegExp('\\b' + w + '\\b', 'ig'), '')
    })
    return text
  }

  sentiment (text, callback) {
    text = this.removeFillers(text)
    retext().use(sentiment, this.options).use(function () {
      return function (cst) {
        let overallScore = cst.data || {}
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
