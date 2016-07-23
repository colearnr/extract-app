const ExtractLib = require('../index')
const vows = require('vows')
const assert = require('assert')

const suite = vows.describe('extract app test suite')
const ExtractApp = new ExtractLib()
const NlpAnalysisLib = require('../lib/nlp')
const NlpAnalysis = new NlpAnalysisLib()

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
}).addBatch({
  'Check if we can use intensify api': {
    topic: function () {
      let text = 'Tests of the Shroud of Turin have produced some curious findings. For example, the pollen of forty-eight plants native to Europe and the Middle East. Scientists report no human deaths due to excessive caffeine consumption. Although caffeine does cause convulsions and death in certain animals. The hearing was planned for Monday, December 2, but not all of the witnesses could be available, so it was rescheduled for the following Friday, and then all the witnesses could attend.'
      NlpAnalysis.intensify(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj.messages)
    }
  },

  'Check if we can use keywords api': {
    topic: function () {
      let text = `
      Air Vice Marshal Ian Dougald McLachlan, CB, CBE, DFC (23 July 1911 – 14 July 1991) was a senior commander in the Royal Australian Air Force (RAAF). Born in Melbourne, he was a cadet at the Royal Military College, Duntroon, before joining the Air Force in December 1930. After serving in instructional and general flying roles, he took command of No. 3 Squadron in December 1939, leading it into action in the Middle East less than a year later. Awarded the Distinguished Flying Cross, he returned to Australia in 1942 to command air bases in Canberra and Melbourne. The following year he was posted to the South West Pacific, where he led successively Nos. 71 and 73 Wings. Having been promoted to group captain, he took charge of Southern Area Command in 1944, and No. 81 Wing in the Dutch East Indies the following year.
Raised to acting air commodore in 1946, McLachlan served as senior air staff officer for the British Commonwealth Air Group in Japan until 1948. After leading North-Eastern Area Command in 1951–53, he was appointed a Commander of the Order of the British Empire and posted to Britain, where he attended the Imperial Defence College. Promoted air vice marshal, he returned to Australia in 1957 as Air Officer Commanding Training Command; in this role he carried out two major reviews focussing on the RAAF's educational and command systems. He was Deputy Chief of the Air Staff from 1959 to 1961, and then Head of the Australian Joint Services Staff in Washington, DC, until 1963. Appointed a Companion of the Order of the Bath in 1966, McLachlan's final post before retiring in 1968 was as Air Member for Supply and Equipment. He was a consultant to Northrop after leaving the RAAF, and lived in Darling Point, Sydney, until his death in 1991.
      McLachlan was awarded the Distinguished Flying Cross (DFC) for his "fine qualities as a fighter pilot" and "determined leadership" in the face of often "overwhelming numbers of enemy aircraft"; the citation was promulgated in the London Gazette on 11 February 1941 under the name "Ian Duncan MacLachlan".[14][15] He was the first RAAF fighter pilot to be decorated in World War II.[16][17] Promoted to wing commander, he took charge of the newly established RAF Benina, Benghazi, on 13 February, handing over No. 3 Squadron to Squadron Leader Peter Jeffrey.[18] By May 1941, McLachlan was acting as RAAF Liaison Officer for the new Air Officer Commanding-in-Chief, RAF Middle East, Air Marshal Arthur Tedder. The Air Board in Melbourne, headed by the Chief of the Air Staff, Air Chief Marshal Sir Charles Burnett, was not consulted over this change of role and took exception to the RAF's "unilateral action" in appointing McLachlan, but eventually acquiesced and permitted him to remain at the post to coordinate facilities for RAAF personnel in the region until July, when he was recalled to Australia.
      `
      NlpAnalysis.keywords(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj.keywords)
      assert.ok(obj.keyphrases)
    }
  },

  'Check if we can use profanities api': {
    topic: function () {
      let text = `
      anal
      anus
      arse
      ass
      ballsack
      balls
      bastard
      bitch
      biatch
      bloody
      `
      NlpAnalysis.profanities(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj.messages)
    }
  },

  'Check if we can use purify test api': {
    topic: function () {
      let text = `
      anal shit hold man
      anus
      arse
      ass just pain in my ass
      ballsack
      balls
      bastard
      bitch
      biatch
      ballsack
      blowjob you bitch
      blow job
      bollock
      bollok
      boner
      boob
      bugger
      bum
      butt
      buttplug
      clitoris
      cock sucker idiot
      coon
      crap
      bloody
      `
      NlpAnalysis.purifyText(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
    }
  },
})
  .export(module)
