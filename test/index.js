const ExtractLib = require('../index').Extract
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
      assert.ok(obj.title)
    }
  },

  'Check if we can parse youtube': {
    topic: function () {
      ExtractApp.processUrl('https://youtu.be/C0DPdy98e4c', false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.ok(obj.title)
      assert.ok(obj.img_url)
    }
  },

  'Check if we can parse vimeo': {
    topic: function () {
      ExtractApp.processUrl('https://vimeo.com/176329517', false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.ok(obj.title)
      assert.ok(obj.img_url)
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
      assert.ok(obj.img_url)
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
      anus.
      arse.
      ass just pain in my ass
      ballsack
      balls.
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
      Hello world
      This is a good asset butter
      `
      NlpAnalysis.purifyText(text, text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
    }
  },

  'Check if we can use sentiment api': {
    topic: function () {
      let text = `
      A film that begins with the everyday lives of naval personnel in San Diego and ends with scenes so true and heartbreaking that tears welled up in my eyes both times I saw the film .
Joan and Philip 's repetitive arguments , schemes and treachery
sounds like another clever if pointless excursion into the abyss

badly edited , often awkwardly directed and suffers from the addition of a wholly unnecessary pre-credit sequence designed to give some of the characters a back story
      the friendship
      Weighted down with slow , uninvolving storytelling and flat acting .

When compared to the usual , more somber festival entries , Davis ' highly personal brand of romantic comedy is a tart , smart breath of fresh air that stands out from the pack even if the picture itself is somewhat problematic
The script is a disaster , with cloying messages and irksome characters .
is a shame that more wo n't get an opportunity to embrace small , sweet  Evelyn . '
      a china shop , a provocateur crashing into ideas and special-interest groups as he slaps together his own brand of liberalism

      `
      NlpAnalysis.sentiment(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
    }
  },

  'Check if we can use readability api': {
    topic: function () {
      let text = `
      Early career

Hoy joined his first cycling club, Dunedin C.C., in 1990 aged 14, and began concentrating on track cycling in 1993, when he joined the City of Edinburgh Racing Club.[7]

Hoy won silver in Berlin, at the 1999 UCI Track Cycling World Championships in the team sprint, riding at man one, Craig MacLean at 2 and Jason Quealley at 3. Regular team mates in the team sprint over the years have included Craig Maclean, Ross Edgar, Jamie Staff, Jason Queally, Matthew Crampton and Jason Kenny.
2000 Sydney Olympics

Following Jason Queally's Gold Medal in the Kilo TT, Chris joined with him and Craig MacLean to win his first Olympic Medal, a Silver in the Team Sprint or "Olympic Sprint" as it was then called. They were beaten by an excellent French team but the two medals won for GB was the start of the renaissance of British Cycling which has led on to remarkable results over his career.
2004 Olympics: Athens

Chris arrived in Athens in the form of his life. His main event was the Kilo Time Trial and the race produced what is probably the best ever Kilo competition. He was ranked No 1 and was last man off. The sea level World Record was broken four times as he sat in the track centre waiting for his start. He had been involved in an accident in the athlete's village just a few days prior to competition where he came off his bike in front of a village bus, narrowly avoiding serious injury. As he came out of the starting gate, his scarred arms and legs showed how close he was to not competing. The previous rider was the great Arnaud Tournant who set the fastest ever sea-level kilo. Chris came next and, cheered on by thousands of loyal British fans, he bettered the time on each lap, setting a new sea-level World and Olympic Record of 1.00.711. This was the first of his Olympic Gold medals and added to the Silver, won in the Team Sprint in Sydney in 2000.
Post-2004 Olympics

Following the decision to remove the Kilo from the Olympic programme after the 2004 games, Hoy sought to develop in other events.[8] The first of these was the keirin. This event involves between six and eight riders following a small motorbike (the Derny) around the 250m track for 5.5 laps, as the bike slowly builds up the speed. The bike pulls off with 2.5 laps to go and the riders race for the line. Hoy had previously competed at the keirin in various events but one of his first major successes was at the Manchester round of the World Cup Classics Series in 2007, shortly before the World Championships, where he also won, ahead of his team mate Ross Edgar.[citation needed]

This showed that Hoy was developing from just a pure power sprinter, in events like the Kilo and Team Sprint, into also being one of the best in the world at more tactical sprinting events such as the keirin[9] and the individual sprint.
2007 world record attempt

On 12 May 2007, Hoy attempted the world record for the kilometre. He fell 0.005 seconds short, clocking 58.880. He set a record for the 500m flying start at 24.758 seconds, over a second less than the 25.850 set by Arnaud Duble. Hoy set the sea-level kilometre record of 1 minute 0.711 seconds by winning the Olympics in Athens in 2004. The outright record of 58.875 seconds is held by Arnaud Tournant (France), set during 2001 at altitude in La Paz, Bolivia, where Hoy also attempted to break the record. At the time, only 3 sub-60sec kilos had ever been ridden; Hoy recorded two of these over two days in La Paz.[10]

Hoy's main achievement is his development in the individual sprint event considered to be the blue riband event of track cycling.[11] Kilo riders like Hoy have historically not fared as well at this event, as they were less experienced in the tactical elements required for the sprint. Previously, Hoy had competed in the sprint at various World Cup events and Revolution meetings in Manchester, but it was not one of his main events and he did not compete in it at the World Championships or the Olympics. In the semi finals Hoy defeated Italian veteran Roberto Chiappa 2–0, to set up a meeting in the final against France's Kevin Sireau. Sireau was the World Cup Classics points winner for the season and had defeated Hoy 2–0 in their previous meeting only a few weeks earlier. However, with the vocal Manchester crowd behind him Hoy was not to be denied victory and he completed the win 2–0, the first British man to win the sprint title in 52 years since Reg Harris.[12]
      `
      NlpAnalysis.readability(text, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
    }
  }
}).addBatch({
  'Check if we can parse ft': {
    topic: function () {
      ExtractApp.processUrl('http://www.ft.com/cms/s/0/50fe03c8-525a-11e6-befd-2fc0c26b3c60.html', false, this.callback)
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.ok(obj.text)
      assert.ok(obj.title)
    }
  }
}).addBatch({
  'Filler words test': {
    topic: function () {
      let text = 'The sky is a blue apple abra cadabra blah blah an elephant is red'
      this.callback(null, NlpAnalysis.removeFillers(text))
    },
    'check': function (err, obj) {
      assert.equal(err, null)
      assert.ok(obj)
      assert.equal(obj, ' sky   blue apple abra cadabra    elephant  red')
    }
  }
}).addBatch({
  'More sentiment tests': {
    topic: function () {
      let text = `Help me. I cant understand this topic.'
                  Great work team. Keep it up.
                  This is not a good work is it?
                  This is not a good work.`
      NlpAnalysis.sentiment(text, this.callback)
    },
    'check': function (err, obj) {
      let paraPolarity = [-1, 0, -3, -3]
      let paraValence = ['negative',
        'neutral',
        'negative',
        'negative'
      ]
      assert.equal(err, null)
      assert.ok(obj)
      let index = 0
      obj.paragraphScore.forEach((p, i) => {
        if (p) {
          assert.equal(p.polarity, paraPolarity[index])
          assert.equal(p.valence, paraValence[index])
          index++
        }
      })
    }
  }
})
  .export(module)
