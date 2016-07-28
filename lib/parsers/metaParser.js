const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')

class MetaParser {

  constructor () {
  }

  parse ($, url, options) {
    let meta = {}
    $('meta').each((i, e) => {
      if (e.attribs) {
        if (e.attribs.itemprop) {
          meta[ e.attribs.itemprop.replace('og:', '') ] = e.attribs.content
        } else if (e.attribs.name) {
          meta[ e.attribs.name.replace('og:', '') ] = e.attribs.content
        } else if (e.attribs.property) {
          meta[ e.attribs.property.replace('og:', '') ] = e.attribs.content
        }
      }
    })
    if (meta.image) {
      meta.img_url = meta.image.split(',')
    }
    if (!meta.embed && meta.videoId) {
      meta.embed = meta.videoId
    }
    return meta
  }

}

module.exports = MetaParser
