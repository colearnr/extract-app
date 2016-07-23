const retext = require('retext')
const intensify = require('retext-intensify')
const nlcstToString = require('nlcst-to-string')
const keywords = require('retext-keywords')
const profanities = require('retext-profanities')
const profanitiesList = require('../data/profanities.json')
const profanitiesMap = new Map()

profanitiesList.forEach(v => {
  profanitiesMap.set(v, 1)
})

class NlpAnalysis {
  constructor () {

  }

  intensify(text, callback) {
    retext().use(intensify).process(text, callback)
  }

  keywords(text, callback) {
    retext().use(keywords).process(text, function (err, result) {
      let space = result.namespace('retext')
      let klist = space.keywords.map(n => nlcstToString(n.matches[0].node))
      let kplist = space.keyphrases.map(n => n.matches[0].nodes.map(nlcstToString).join(''))
      callback(err, {keywords: klist, keyphrases: kplist})
    })
  }

  profanities(text, callback) {
    retext().use(profanities).process(text, callback)
  }

  purifyText(text, callback) {
    text = text || ''
    text.split(/\s/).forEach(w => {
      if (profanitiesMap.get(w)) {
        text = text.replace(w, '*' + w.split('').join('*').replace(/[a-zA-Z0-9]/g, ''))
      }
    })
    callback(null, text)
  }
}

module.exports = NlpAnalysis
