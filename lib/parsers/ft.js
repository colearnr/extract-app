const sanitizeHtml = require('sanitize-html')
const cheerio = require('cheerio')

class FTParser {

  parse ($, url, options) {
    let image = $('.story-image img').attr('src')
    let body = $('#storyContent').html()
    let videos = $('.storyvideo').html()
    let img_url = image ? [image] : null
    body = sanitizeHtml(body, { allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'main', 'article', 'section' ]) })
    return {image, img_url, body, videos}
  }

}

FTParser.supportedDomains = ['ft.com']

module.exports = FTParser
