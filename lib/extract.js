const sdk = require('colearnr-sdk')
const CoreApp = sdk.CoreApp
const Events = sdk.Events
const logger = sdk.Logger
const extractor = require('unfluff')
const request = require('request')
const unembed = require('unembed')
const _ = require('lodash')

const GOOGLE_SEARCH_URL = 'http://www.google.co.uk/url?sa=t&rct=j&q=&esrc=s&source=colearnr&cd=1&cad=rja&uact=8&ved=0CDEFFjAA&url=$URL&ei=Y1sDVY24WpSO7AaNpoDIAQ&usg=AFRjCKE2LScP4sOG-TytWZe-kB0UNbWncg&bvm=bv.81198403,d.GFU'

/**
 * Extract is a core app
 */
class Extract extends CoreApp {

  constructor() {
    super()

    this.on(Events.LEARNBIT_CREATED, this.processLearnbit)
    this.on(Events.LEARNBIT_UPDATED, this.processLearnbit)
  }

  /**
   * Method to process learnbit
   *
   * @param user user
   * @param lbit Learnbit object
   * @param callback Callback
   */
  processLearnbit(user, lbit, callback) {
    logger.debug('Process learnbit', user, lbit._id)
    let url = lbit.url
    let self = this
    if (url) {
      return this.processUrl(url, function (err, meta) {
        self.notifyExtractResult(user, lbit._id, meta)
        callback(err, meta)
      })
    } else if (lbit.body) {
      return this.processHtml(lbit.body, function (err, meta) {
        self.notifyExtractResult(user, lbit._id, meta)
        callback(err, meta)
      })
    } else {
      logger.warn('Unable to process learnbit', lbit._id)
      callback(null, null)
    }
  }

  /**
   * Method to process url
   *
   * @param url http(s) url
   * @param callback Callback
   */
  processUrl(url, callback) {
    if (url) {
      logger.debug('About to process', url)
      request({
        url: url,
        jar: false,
        headers: {
          referer: GOOGLE_SEARCH_URL.replace('$URL', encodeURIComponent(url)),
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
        },
        agentOptions: {
          rejectUnauthorized: false
        }
      }, (error, response, body) => this.processHtml(body, callback))
    } else {
      callback(null, null)
    }
  }

  /**
   * Method to process html content
   *
   * @param html Html content
   * @param callback Callback
   */
  processHtml(html, callback) {
    callback(null, extractor(html || ''))
  }

  /**
   * Method to process embed code
   *
   * @param embedCode Embed code
   * @param callback Callback
   */
  processEmbedCode(embedCode, callback) {
    let meta = unembed.parse(embedCode)
    let url = meta.url || meta.href || meta.direct_url
    if (url) {
      this.processUrl(url, function (err, parsedData) {
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
  notifyExtractResult(user, lbitId, meta) {
    logger.debug('Extract complete for', lbitId)
    this.emit(Events.LEARNBIT_EXTRACTED, user, lbitId, meta)
  }
}

module.exports = Extract
