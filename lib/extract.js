const sdk = require('colearnr-sdk')
const CoreApp = sdk.CoreApp
const Events = sdk.Events
const logger = sdk.Logger
const extractor = require('unfluff')
const request = require('request')
const unembed = require('unembed')
const _ = require('lodash')
const analyseLib = require('./analyse')
const analyser = new analyseLib()
const nlpLib = require('./nlp')
const nlpAnalyser = new nlpLib()
const async = require('async')

const GOOGLE_SEARCH_URL = 'http://www.google.co.uk/url?sa=t&rct=j&q=&esrc=s&source=colearnr&cd=1&cad=rja&uact=8&ved=0CDEFFjAA&url=$URL&ei=Y1sDVY24WpSO7AaNpoDIAQ&usg=AFRjCKE2LScP4sOG-TytWZe-kB0UNbWncg&bvm=bv.81198403,d.GFU'

function noop () {
}

/**
 * Extract is a core app
 */
class Extract extends CoreApp {

  constructor () {
    super()
    CoreApp.EventEmitter.on(Events.LEARNBIT_CREATED, this.processLearnbit.bind(this))
    CoreApp.EventEmitter.on(Events.LEARNBIT_UPDATED, this.processLearnbit.bind(this))
    CoreApp.EventEmitter.on(Events.LEARNBIT_OPTIMISED, this.processLearnbit.bind(this))
  }

  /**
   * Method to quickly process a learnbit extracting just title, description and images alone
   *
   * @param user user
   * @param lbit Learnbit object
   * @param callback Callback
   */
  quickProcess (user, lbit, callback) {
    let url = lbit.url
    if (url) {
      this.processUrl(url, true, function (err, elib, html) {
        let meta = {}
        meta.title = elib.title()
        meta.description = elib.description()
        meta.image = elib.image()
        callback(err, meta)
      })
    } else {
      callback(null, {})
    }
  }

  /**
   * Method to process learnbit
   *
   * @param user user
   * @param lbit Learnbit object
   * @param callback Callback
   */
  processLearnbit (user, lbit, callback) {
    callback = callback || noop
    logger.debug('Process learnbit', lbit.url)
    let url = lbit.url
    let self = this
    if (lbit.body && (lbit.type === 'html' || lbit.type === 'inline-html')) {
      return this.processHtml(lbit.body, false, url, function (err, meta, html) {
        lbit.friendlyTime = null
        lbit.time = null
        self.notifyExtractResult(user, '' + lbit._id, meta, html)
        callback(err, meta)
      })
    } else if (url) {
      return this.processUrl(url, false, function (err, meta, html) {
        if (lbit.type !== 'html' || lbit.type !== 'inline-html') {
          lbit.friendlyTime = null
          lbit.time = null
        }
        self.notifyExtractResult(user, '' + lbit._id, meta, html)
        callback(err, meta)
      })
    } else {
      logger.warn('Unable to process learnbit', lbit.url)
      callback(null, {})
    }
  }

  /**
   * Method to process url
   *
   * @param url http(s) url
   * @param lazy Lazy mode (Default: false)
   * @param callback Callback
   */
  processUrl (url, lazy, callback) {
    if (url) {
      logger.debug('About to process', url, lazy)
      request({
        url: url,
        jar: false,
        headers: {
          referer: GOOGLE_SEARCH_URL.replace('$URL', encodeURIComponent(url)),
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        },
        agentOptions: {
          rejectUnauthorized: false
        }
      }, (error, response, body) => this.processHtml(body, lazy, url, callback))
    } else {
      callback(null, null)
    }
  }

  /**
   * Method to process html content
   *
   * @param html Html content
   * @param lazy Lazy mode (Default: false)
   * @param callback Callback
   */
  processHtml (html, lazy, url, callback) {
    logger.debug('Process html', lazy, url)
    html = html || ''
    if (typeof url === 'function') {
      callback = url
      url = null
    }
    if (lazy) {
      callback(null, extractor.lazy(html || ''), html)
    } else {
      let meta = extractor(html || '')
      if (!meta.image && meta.cover_image) {
        meta.image = meta.cover_image
      }
      if (!meta.img_url) {
        meta.img_url = meta.image ? [ meta.image ] : null
      }
      if (!meta.tags) {
        meta.tags = meta.keywords ? meta.keywords.split(',') : []
      }
      let bodyContent = null
      if (html.indexOf('<body') === -1) {
        bodyContent = html
      }
      let body = analyser.getBody(html, bodyContent, url)
      let text = body.text
      _.merge(meta, body)
      async.parallel({
        keywords: (cb) => nlpAnalyser.keywords(text, cb),
        cleanBody: (cb) => nlpAnalyser.purifyText(bodyContent || body.body, text, cb),
        sentiment: (cb) => nlpAnalyser.sentiment(text, cb)
      }, function (err, results) {
        _.merge(meta, results)
        let keywords = results.keywords.keywords || []
        meta.tags = meta.tags.concat(keywords)
        meta.tags = meta.tags.map(v => v.toLowerCase())
        callback(null, meta, html)
      })
    }
  }

  /**
   * Method to process embed code
   *
   * @param embedCode Embed code
   * @param callback Callback
   */
  processEmbedCode (embedCode, lazy, callback) {
    let meta = unembed.parse(embedCode)
    let url = meta.url || meta.href || meta.direct_url
    if (url) {
      this.processUrl(url, lazy, function (err, parsedData) {
        if (!parsedData.image && meta.cover_image) {
          parsedData.image = meta.cover_image
        }
        let mergedData = _.merge(parsedData || {}, meta)
        callback(err, mergedData)
      })
    } else if (meta) {
      callback(null, meta)
    } else {
      callback(null, null)
    }
  }

  /**
   * Method to emit extract complete event
   *
   * @param user User
   * @param lbitId Learnbit Id
   * @param meta Parsed metadata
   */
  notifyExtractResult (user, lbitId, meta) {
    logger.debug('Extract complete for', lbitId)
    CoreApp.EventEmitter.emit(Events.LEARNBIT_EXTRACTED, user, lbitId, meta)
  }
}

module.exports = Extract
