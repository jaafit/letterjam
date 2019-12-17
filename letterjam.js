var PLAYERCOUNT = 4
function setPlayerCount(pc) {
    PLAYERCOUNT = pc
}

var LJALPHABET = 'abcdefghiklmnoprstuwy'
var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'


function reqListener(e) {
    WORDS = JSON.parse(this.responseText);
    WORDS = WORDS.words
    window.localStorage.setItem('WORDS', JSON.stringify(WORDS))
    console.log('loaded')
    startgame()
}
var WORDS = window.localStorage.getItem('WORDS')
if (WORDS)
    WORDS = JSON.parse(WORDS)
else {
    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open("get", "https://www.eatifketo.com/lj/mywords.json", true);
    oReq.send();
}


var counts  = '4a 2b 3c 3d 6e 2f 2g 3h 4i 2k 3l 2m 3n 4o 2p 4r 4s 4t 3u 2w 2y'
counts = counts.split(' ')
var CARDS = []
counts.forEach(function(c) {
    for (var i = 0; i < c[0]; i++) {
        CARDS.push(c[1])
    }
})

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


function haswild(w) {
    for (var c = 0; c < w.length; c++) {
        if (!~LETTERS.indexOf(w[c]))
            return true
    }
    return false
}
function hastoomanywilds(w) {
    var wild = false
    for (var c = 0; c < w.length; c++) {
        if (!~LETTERS.indexOf(w[c]) && w[c] !== wild) {
            if (!wild)
                wild = w[c]
            else
                return true
        }
    }
    return false
}
function includesAplayer(w) {
    for (var c = 0; c < w.length; c++)
        if (LETTERS.indexOf(w[c]) >= PLAYERCOUNT-2)
            return true
    return false
}
function bsearch(value) {
    var firstIndex  = 0,
        lastIndex   = WORDS.length - 1,
        middleIndex = Math.floor((lastIndex + firstIndex)/2);

    while(WORDS[middleIndex] !== value && firstIndex < lastIndex)
    {
        if (value < WORDS[middleIndex])
        {
            lastIndex = middleIndex - 1;
        }
        else if (value > WORDS[middleIndex])
        {
            firstIndex = middleIndex + 1;
        }
        middleIndex = Math.floor((lastIndex + firstIndex)/2);
    }

    return (WORDS[middleIndex] !== value) ? -1 : middleIndex;
}
function isword(word, clue) {
    if (~word.indexOf('*')) { // has wild?
        for (var l = 0; l < ALPHABET.length; l++) {
            var subbed = word.replace(/\*/g, LJALPHABET[l])
            if (~bsearch(subbed))
                return true
            if (subbed === clue) // we assume clue is also a valid word
                return true
        }
        return false
    }
    else
        return word === clue || ~bsearch(word)
}

function getleastambiguous(word, sofar) {

    if (sofar.length < word.length) { // are we still building this sequence?

        // find the next letter in the sequence that results in the least ambiguity
        var nextletter = word[sofar.length]
        var foundLetter = false
        var bestclue
        for (var i = 0; i < LETTERS.length; i++) {
            if (LETTERS[i] === nextletter) {
                foundLetter = true
                var thisclue = getleastambiguous(word, sofar.concat([i]))
                if (!bestclue || thisclue.unambiguity >= bestclue.unambiguity){
                    bestclue = thisclue
                }
            }
        }
        if (foundLetter)
            return bestclue
        else {
            sofar.push(-1) // use wild
            return getleastambiguous(word, sofar)
        }
    }
    else { // sofar is a valid sequence
        var clue = {'sequence': sofar, 'unambiguity': 0, 'perspectives':{}}

        // score it
        for (var perspective = 0; perspective < PLAYERCOUNT-1; perspective++) {

            var hasMyLetter = false
            for (var s = 0; s < sofar.length; s++)
                if (sofar[s] === perspective)
                    hasMyLetter = true
            if (!hasMyLetter)
                continue

            // go through each letter to see how many are valid
            clue.perspectives[perspective] = []

            for (var l = 0; l < LJALPHABET.length; l++) {
                var tryword = ''
                for (s = 0; s < clue.sequence.length; s++) {
                    if (clue.sequence[s] === perspective)
                        tryword += LJALPHABET[l]
                    else if (clue.sequence[s] === -1)
                        tryword +=  '*'
                    else
                        tryword += LETTERS[clue.sequence[s]]
                }

                if (isword(tryword, word)) {
                    clue.perspectives[perspective].push(tryword)
                }
            }

            if (clue.perspectives[perspective].length)
                clue.unambiguity += 1/clue.perspectives[perspective].length
        }

        return clue
    }

}

function scoreclue(clueWord) {
    // count players used and npcs used
    var players = 0
    var npcs = 0
    var unusedPlayers = LETTERS.slice(0,PLAYERCOUNT-1)
    var unusedNpcs = LETTERS.slice(PLAYERCOUNT-1)
    for (var i = 0; i < clueWord.length; i++) {
        var pio = unusedPlayers.indexOf(clueWord[i])
        var npcio = unusedNpcs.indexOf(clueWord[i])
        if (~pio) {
            unusedPlayers.splice(pio,1)
            players++
        }
        else if (~npcio) {
            unusedNpcs.splice(npcio,1)
            npcs++
        }
    }

    // find optimal sequence for lowest ambiguity
    var clue = getleastambiguous(clueWord, [])
    clue.word = clueWord
    clue.players = players;
    clue.npcs = npcs
    clue.wild = haswild(clueWord)
    clue.score = clue.unambiguity
    clue.score += npcs * .1
    clue.score -= clue.wild ? .01 : 0
    return clue
}

var CLUES = []
var LJcallback = {
    'onFindClues': function() {}
}
function findclues() {
    if (!WORDS)
        return

    var valid = WORDS.filter(function(w) {
        return !hastoomanywilds(w) && includesAplayer(w)
    })
    console.log('scoring',valid.length,'clues')

    // score each clue
    var clues = valid.map(function(c) {
        return scoreclue(c)
    })

    // sort clues by score
    clues.sort(function(a,b) {
        return b.score - a.score
    })

    // print top 10
    CLUES = clues.slice(0,10)
    LJcallback.onFindClues()
    console.log('clues', CLUES)
}

var STARTED = false
var LETTERS = []
function startgame() {
    if (!WORDS || STARTED)
        return
    STARTED = true

    shuffle(CARDS)
    LETTERS = CARDS.slice(0,5)
    //LETTERS = ['c', 'l','u','e','s']
    
    // find valid clues
    findclues()

}
startgame()