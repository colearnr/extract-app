const _ = require('lodash')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
const sanitizeHtml = require('sanitize-html')
const path = require('path')
const fs = require('fs')
const urlUtils = require('url')
const cheerio = require('cheerio')
const MetaParserLib = require('./parsers/metaParser')
const MetaParser = new MetaParserLib()

const DEFAULT_OPTIONS = {
  threshold: 100,
  min_length: 80,
  decay_factor: 0.73,
  continuous_factor: 1.62,
  punctuation_weight: 10,
  punctuations: /([、。，．！？]|\.[^A-Za-z0-9]|,[^0-9]|!|\?)/,
  waste_expressions: /Copyright|All Rights Reserved/i,
  debug: false
}

let domainParsers = {}
const PARSER_DIR = path.join(__dirname, 'parsers')
const CL_PROTOCOL = 'cl://'

function loadParsers () {
  if (!fs.existsSync(PARSER_DIR)) {
    return
  }
  let files = fs.readdirSync(PARSER_DIR)
  files.filter(file => fs.statSync(path.join(PARSER_DIR, file)).isFile()).forEach(file => {
    if (!new RegExp('^\\.').test(file)) {
      let module = null
      try {
        module = require(path.join(PARSER_DIR, file))
        if (module.supportedDomains) {
          module.supportedDomains.forEach(d => {
            domainParsers[d] = module
            // Automatically add www to the host
            if (d.indexOf('www') === -1) {
              domainParsers['www.' + d] = module
            }
          })
        }
      } catch (e) {}
    }
  })
}
loadParsers()

class Analyse {
  constructor (options) {
    this.options = {}
    _.merge(this.options, DEFAULT_OPTIONS)
    _.merge(this.options, options || {})
  }

  friendlyTime (sec) {
    if (sec < 60) {
      return '1 min'
    }
    if (sec > 120 && sec < 300) {
      return Math.floor(sec / 60) + ' mins'
    }
    if (sec > 300) {
      return 'Over 5 mins'
    }
    return ''
  }

  getBody (html, bodyContent, url) {
    let self = this
    let body = ''
    let meta = {}

    if (bodyContent === '') {
      bodyContent = null
    }
    // Skip CL media files for now
    if (url && (url.indexOf(CL_PROTOCOL) !== -1)) {
      return {}
    }

    if (url) {
      let urlObj = urlUtils.parse(url, true, true)
      let parser = domainParsers[urlObj.hostname] || domainParsers[urlObj.host]
      let $ = cheerio.load(html, {normalizeWhitespace: true,
      xmlMode: true})
      meta = MetaParser.parse($, url, {})
      if (parser) {
        _.merge(meta, new parser().parse($, url, {}) || {})
        bodyContent = meta.body
      }
    }

    if (!bodyContent || bodyContent === '' || bodyContent === 'null') {
      html = html.replace(/<!--\s*google_ad_section_start\(weight=ignore\)\s*-->[\s\S]*?<!--\s*google_ad_section_end.*?-->/mg, '')
      if (html.match(/<!--\s*google_ad_section_start[^>]*-->/)) {
        let m = html.match(/<!--\s*google_ad_section_start[^>]*-->([\s\S]*?)<!--\s*google_ad_section_end.*?-->/m)
        html = m[ 1 ]
      }
      let title = this.getTitle(html)
      html = this.eliminate_useless_tags(html)

      // h? block including title
      html = html.replace(/(<h\d\s*>\s*(.*?)\s*<\/h\d\s*>)/ig, function ($0, $1, $2, $3) {
        if ($2.length >= 3 && title.indexOf($2) >= 0) {
          return '<div>' + $2 + '</div>'
        } else {
          return $1
        }
      })

      let factor = 1.0
      let continuous = 1.0
      let score = 0
      let bodylist = []
      let list = html.split(/<\/?(?:div|center|article|main|section|td)[^>]*>|<p\s*[^>]*class\s*=\s*["']?(?:posted|plugin-\w+)['"]?[^>]*>/)

      list.forEach(function (block) {
        if (!block) {
          return
        }
        block = block.trim()
        if (self.has_only_tags(block)) {
          return
        }
        block = sanitizeHtml(block, { allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'main', 'article', 'section' ]) })
        if (body.length > 0) {
          continuous /= self.options.continuous_factor
        }

        let notlinked = self.eliminate_link(block)
        if (notlinked.length < self.options.min_length) {
          return
        }

        let c = (notlinked.length + self.str_scan(notlinked, self.options.punctuations).length * self.options.punctuation_weight) * factor
        factor *= self.options.decay_factor
        let not_body_rate = self.str_scan(block, self.options.waste_expressions).length + self.str_scan(block, /amazon[a-z0-9\.\/\-\?&]+-22/i).length / 2.0
        if (not_body_rate > 0) {
          c *= (Math.pow(0.72, not_body_rate))
        }
        let c1 = c * continuous

        if (self.options.debug) {
          console.log(c, '*', continuous, '=', c1, notlinked.length)
        }

        if (c1 > self.options.threshold) {
          body += block.trim() + '\n'
          score += c1
          continuous = self.options.continuous_factor
        }
        else if (c > self.options.threshold) { // continuous block end
          bodylist.push([ body, score ])
          body = block.trim() + '\n'
          score = c
          continuous = self.options.continuous_factor
        }
      })
      bodylist.push([ body, score ])
      body = bodylist.reduce(function (a, b) {
        if (a[ 1 ] >= b[ 1 ]) {
          return a
        } else {
          return b
        }
      }, [ '', 0 ])
      bodyContent = body[0]
    }
    if (bodyContent === 'null') {
      bodyContent = ''
    }
    let mainText = this.strip_tags(bodyContent, self.dom_separator)
    let wordsCount = mainText.replace(/[.,?!;()"'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ').length
    let time = (wordsCount / 220) * 60
    delete meta.type
    return _.merge({body: bodyContent, text: mainText, wordsCount, time, friendlyTime: this.friendlyTime(time)}, meta)
  }

  getTitle (html) {
    let m = html.match(/<title[^>]*>\s*(.*?)\s*<\/title\s*>/i)
    if (m) {
      return this.strip_tags(m[1])
    }else {
      return ''
    }
  }

  eliminate_useless_tags (html) {
    // eliminate useless symbols
    html = html.replace(/[\342\200\230-\342\200\235]|[\342\206\220-\342\206\223]|[\342\226\240-\342\226\275]|[\342\227\206-\342\227\257]|\342\230\205|\342\230\206/g, '')

    // eliminate useless html tags
    html = html.replace(/<(script|nav|header|footer|form|input|textarea|iframe|select|noscript)[^>]*>[\s\S]*?<\/\1\s*>/img, '')
    html = html.replace(/<meta.*\/>/ig, '')
    html = html.replace(/<link.*\/>/ig, '')
    html = html.replace(/<input.*\/>/ig, '')
    html = html.replace(/<meta.*>/ig, '')
    html = html.replace(/<link.*>/ig, '')
    html = html.replace(/<input.*>/ig, '')
    html = html.replace(/<head.*>/ig, '')
    html = html.replace(/<body.*>/ig, '')
    html = html.replace(/<!--[\s\S]*?-->/mg, '')
    html = html.replace(/<![A-Za-z].*?>/g, '')
    html = html.replace(/<div\s[^>]*class\s*=\s*['"]?alpslab-slide["']?[^>]*>[\s\S]*?<\/div\s*>/mg, '')
    html = html.replace(/<ul\s[^>]*role\s*=\s*['"]?navigation["']?[^>]*>[\s\S]*?<\/ul\s*>/mg, '')
    html = html.replace(/<div\s[^>]*(id|class)\s*=\s*['"]?\S*more\S*["']?[^>]*>/ig, '')
    return html
  }

  has_only_tags (st) {
    return st.replace(/<[^>]*>/img, '').replace(/&nbsp/g, '').trim().length == 0
  }

  eliminate_link (html) {
    let count = 0
    let notlinked = html.replace(/<a\s[^>]*>[\s\S]*?<\/a\s*>/img, function () {
      count += 1
      return ''
    }).replace(/<form\s[^>]*>[\s\S]*?<\/form\s*>/img, '')
    notlinked = this.strip_tags(notlinked)
    if (notlinked.length < 20 * count || this.islinklist(html)) {
      return ''
    }
    return notlinked
  }

  strip_tags (html, separator) {
    if (separator === undefined) {
      separator = ''
    }
    html = html || ''
    let self = this
    let st = html.replace(/<br>/mg, '\n')
    st = st.replace(/<br \/>/mg, '\n')
    st = st.replace(/<p>&nbsp;<\/p>/mg, '\n')
    st = st.replace(/<.+?>/mg, separator)
    // Convert from wide character to ascii
    // symbols, 0-9, A-Z
    st = st.replace(/[Ａ-Ｚａ-ｚ０-９－！”＃＄％＆’（）＝＜＞，．？＿［］｛｝＠＾～￥]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    })
    st = st.replace(/[\342\224\200-\342\224\277]|[\342\225\200-\342\225\277]/g, '')
    st = st.replace(/\343\200\200/g, ' ')
    st = entities.decode(st)
    st = st.replace(/[ \t]+/g, ' ')
    st = st.replace(/\n\s*/g, '\n')
    return st
  }

  islinklist (st) {
    let m = st.match(/<(?:ul|dl|ol)(.+?)<\/(?:ul|dl|ol)>/im)
    if (m) {
      let listpart = m[1]
      let outside = st.replace(/<(?:ul|dl)(.+?)<\/(?:ul|dl)>/img, '').replace(/<.+?>/mg, '').replace(/\s+/g, ' ')
      let list = listpart.split(/<li[^>]*>/)
      list.shift()
      let rate = this.evaluate_list(list)
      return outside.length <= st.length / (45 / rate)
    }else {
      return false
    }
  }

  evaluate_list (list) {
    if (list.length == 0) {
      return 1
    }
    let hit = 0
    list.forEach(function (line) {
      if (line.match(/<a\s+href=(['"]?)([^"'\s]+)\1/im)) {
        hit++
      }
    })
    return 9 * Math.pow(1.0 * hit / list.length, 2) + 1
  }

  str_scan (str, regexp) {
    let r = []
    str.replace(regexp, function () {
      r.push(Array.prototype.slice.call(arguments, 1, -2))
    })
    return r
  }

}

module.exports = Analyse
