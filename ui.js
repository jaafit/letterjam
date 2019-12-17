function refresh() {
    STARTED = false
    startgame()
    updateUI()

    $("#help").addClass('hidden')
    $("#clue").val('')
    $("#clueerrors").html('')
}

function updateUI() {
    var displayLetters = ''
    for (var l = 0; l < LETTERS.length; l++) {
        if (l === PLAYERCOUNT-1)
            displayLetters += '- '
        displayLetters += '<span id="letter'+l+'" class="letter">'+LETTERS[l].toUpperCase()+'</span> '
    }
    $("#letters").html(displayLetters)

    $("#ai-clues").html('')
    $("#ai-clue-table").addClass('hidden')
    $("#human-clue-table").addClass('hidden')
    for (var p = 0; p < LETTERS.length; p++)
        $("#possibilities"+p).addClass('hidden')

    for (var i = 0; i < CLUES.length; i++) {
        $("#ai-clues").append('<div id="airow'+i+'" class="row"></div>')
        $("#airow"+i).append(
            [
            '<div class="col-xs-1 col-sm-2"><p id="aiword'+i+'"></pid></div>',
            '<div class="col-xs-1 col-sm-2"><p id="ailength'+i+'"></pid></div>',
            '<div class="col-xs-1 col-sm-2"><p id="aiplayers'+i+'"></pid></div>',
            '<div class="col-xs-1 col-sm-2"><p id="ainpcs'+i+'"></pid></div>',
            '<div class="col-xs-1 col-sm-2"><p id="aiwild'+i+'"></pid></div>',
            '<div class="col-xs-1 col-sm-2"><p id="aidis'+i+'"></pid></div>'])

        $("#aiword"+i).html(CLUES[i].word)
        $("#ailength"+i).html(CLUES[i].word.length)
        $("#aiplayers"+i).html(CLUES[i].players)
        $("#ainpcs"+i).html(CLUES[i].npcs)
        $("#aiwild"+i).html(CLUES[i].wild?'yes':'no')
        $("#aidis"+i).html(CLUES[i].unambiguity.toFixed(2))
    }

    $("#clue").focus()

}

function onPlayerCountChange(playerCount) {
    setPlayerCount(playerCount)
    findclues()
    updateUI()
}

function submitWord(word) {
    word = word.toLowerCase().trim()
    word = word.replace(/[^a-z]*/g, '')

    if (hastoomanywilds(word)) {
        $("#clueerrors").html('Word uses too many wilds')
        return;
    }
    else if (!isword(word))
        $("#clueerrors").html('Word not found in 50,000 most common English words.')
    else
        $("#clueerrors").html('')


    var clue = scoreclue(word)
    $("#hword").html(clue.word)
    $("#hlength").html(clue.word.length)
    $("#hplayers").html(clue.players)
    $("#hnpcs").html(clue.npcs)
    $("#hwild").html(clue.wild?'yes':'no')
    $("#hdis").html(clue.unambiguity.toFixed(2))

    // populate lists of possible words for each letter
    for (var p = 0; p < LETTERS.length; p++) {
        // highlight this letter in each possible word
        if (clue.perspectives[p]) {
            var possibilities = clue.perspectives[p].map(function(c) {
                for (var s = clue.sequence.length; s >= 0; s--)
                    if (clue.sequence[s] === p)
                        c = c.substr(0,s) + '<b>' + c[s] + '</b>' + c.substr(s+1)
                return c
            })
            $("#possibilities"+p).html(possibilities.join(', '))
        }
        else // this letter is not involved
            $("#possibilities"+p).html('')
    }

    updateUI()
    $("#ai-clue-table").removeClass('hidden')
    $("#human-clue-table").removeClass('hidden')
}

$("#refresh").click(refresh)

$("#helplink").click(function() {
    $("#help").removeClass('hidden')
})

$(document).on('click', '.letter', function() {
    var id = this.getAttribute('id').substr(-1)
    $('.possibility').addClass('hidden')
    $('#possibilities'+id).removeClass('hidden')
})

$("input[name='playerCountRadio']").change(function(el) {
    onPlayerCountChange(parseInt(this.value))
})

$("#clueform").submit(function() {
    submitWord($("#clue").val())

    return false;
})

LJcallback.onFindClues = updateUI

$(document).ready(updateUI)