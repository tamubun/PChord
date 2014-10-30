'use strict'

$(function() {
  var NameToIdx = {
    'C': 0,
    'D♭': 1, 'C♯': 1,
    'D': 2,
    'E♭': 3, 'D♯': 3,
    'E': 4,
    'F': 5,
    'G♭': 6, 'F♯': 6,
    'G': 7,
    'A♭': 8,'G♯': 8,
    'A': 9,
    'B♭':10, 'A♯': 10,
    'B': 11
  };
  var IdxToName = [
    ['C'],
    ['D♭', 'D♭', 'C♯'],
    ['D'],
    ['E♭', 'E♭', 'E♭', 'E♭', 'D♯'],
    ['E'],
    ['F'],
    ['G♭', 'F♯'],
    ['G'],
    ['A♭', 'A♭', 'A♭', 'G♯'],
    ['A'],
    ['B♭', 'B♭', 'B♭', 'B♭', 'B♭', 'A♯'],
    ['B']
  ];
  var Chords = {
    /*  和音名:[<密3の列>,<密4の列>]
        <密3/密4の列> --- [s, d0, d1, d2, ...]
          s --- 最初の音の基音からの距離
          d0, d1, d2, .... --- 最初の音からの距離。

        <開の列> = <密の列>の上から二つ目の音をオクターブ下げる */
    '':      [[0, 4, 7], [0, 4, 7]],
    'm':     [[0, 3, 7], [0, 3, 7]],
    '7':     [[0, 4, 10], [0, 4, 7, 10]],
    'M7':    [[0, 4, 11], [0, 4, 7, 11]],
    'm7':    [[0, 3, 10], [0, 3, 7, 10]],
    'dim7':  [[3, 3, 7], [0, 3, 6, 9]],
    'm7b5':  [[3, 3, 7], [0, 3, 6, 10]],
    'aug':   [[0, 4, 8], [0, 4, 8]],
    'sus4':  [[0, 5, 7], [0, 5, 7]],
    '7sus4': [[0, 5, 10], [0, 5, 7, 10]],
    '6':     [[4, 3, 5], [0, 4, 7, 9]],
    'add9':  [[2, 2, 5], [0, 2, 4, 7]]
  };

  var allChords;

  var context = new AudioContext(),
      buffer;

  loadScale()
    .then(function (response) {
      var dfd = $.Deferred();

      context.decodeAudioData(response, function(b) { dfd.resolve(b); });
      return dfd.promise();
    })
    .then(function (b) {
      buffer = b;
      $('#loading').hide();
      $('.piano input').keydown(function(ev) {
        textEntered($(this), ev);
      });
      $('#search .piano td.white, #search .piano td.black').click(function() {
        searchPianoClicked($(this));
      });
      $('#result .piano td.white, #result .piano td.black').click(function() {
        resultPianoClicked($(this));
      });
    });

  generateAll();
  setPrefer();
  $('#prefer').change(setPrefer);
  $('#highest,#lowest,#any1,#any2,#any3,#chord'.split(','))
    .each(function(i, selector) {
      makeKeyboard(selector);
    });
  $('.piano input').val('');
  $('#buttons').on('click', 'button', function(ev) {
    printAndPlay($(ev.target).attr('chord'));
  });
  $('#filters button').click(function() {
    $(this).parents('tr').find('input')
      .prop('checked', $(this).hasClass('all-on'));
  });
  $('#do-search').click(doSearch);

  function loadScale() {
    var dfd = $.Deferred(
      function() {
        var req = new XMLHttpRequest();
        req.open('GET', 'scale.ogg', true);
        req.responseType = 'arraybuffer';
        req.onload = function() { dfd.resolve(req.response); };
        req.send();
      }
    );

    return dfd.promise();
  }

  function play(pos) {
    var src = context.createBufferSource();

    src.buffer = buffer;
    src.connect(context.destination);
    src.start(0, pos+0.05, 0.95);
  }

  function playChord(chord) {
    if ( chord.length > 4 )
      return;

    $(chord).each(function(i, pos) {
      play(+pos);
    });
  }

  function selectPos(keys, pos, clear = true) {
    var tds = keys.find('td[pos]');

    if ( clear )
      tds.removeClass('selected');
    tds.filter('[pos=' + pos + ']').addClass('selected');
  }

  function searchPianoClicked(key) {
    var input = key.siblings().first().find('input'),
        pos;

    input.val('');
    if ( key.hasClass('selected') ) {
      key.removeClass('selected');
    } else {
      pos = +key.attr('pos');
      selectPos(key.parent(), pos);
      input.val(posToName(pos));
      play(pos);
    }
  }

  function resultPianoClicked(key) {
    var keys = key.siblings().add(key);

    if ( key.hasClass('selected') ) {
      key.removeClass('selected');
    } else if ( keys.filter('.selected').length <= 3 ) {
      selectPos(key.parent(), +key.attr('pos'), false);
    } else {
      return;
    }

    printAndPlay(
      keys.filter('.selected')
        .map(function() { return +$(this).attr('pos');})
        .get().join(','));
  }

  function textEntered(input, ev) {
    var text = input.val(),
        keys = input.parents('.keys'),
        chord = [], pos;

    if ( ev.which !== 13 )
      return;
    keys.children().removeClass('selected');
    if ( text === '' )
      return;

    if ( input.attr('id') === 'chord-input' ) {
      $(text.split(',')).each(function(i, name) {
        pos = nameToPos(name);
        if ( pos === null )
          return;
        chord.push(pos);
        selectPos(keys, pos, false);
      });
      playChord(chord);
    } else {
      pos = nameToPos(text);
      if ( pos !== null ) {
        selectPos(keys, pos);
        play(pos);
      }
    }
  }

  function doSearchSub(selector, flag) {
    var pos = nameToPos($(selector).val()),
        keys = $(selector).parents('.keys');

    if ( pos !== null ) {
      selectPos(keys, pos);
      flagOr(flag, posToFlag(pos));
    } else {
      keys.find('.selected').removeClass('selected');
      $(selector).val('');
    }

    return pos
  }

  function doSearch() {
    var highest, lowest, f, i, c, txt,
        flag = [0,0,0],
        ans = [];

    $('#buttons').empty();
    $('#chord-input').val('');
    $('#chord td').removeClass('selected');

    highest = doSearchSub('#highest-input', flag);
    lowest = doSearchSub('#lowest-input', flag);
    doSearchSub('#any1-input', flag);
    doSearchSub('#any2-input', flag);
    doSearchSub('#any3-input', flag);

    if ( flag[0] === 0 && flag[1] === 0 && flag[2] === 0 )
      return;

    for ( i = 0; i < allChords.length; ++i ) {
      c = allChords[i];
      if ( !flagMatch(flag, c.flag) )
        continue;
      if ( highest !== null && highest !== c.chord[c.chord.length-1] )
        continue;
      if ( lowest !== null && lowest !== c.chord[0] )
        continue;
      if ( !$('#filter-base input[value=' + c.base + ']').prop('checked') )
        continue;
      if ( !$('#filter-pattern input[value=' + c.pattern + ']')
           .prop('checked') )
        continue;
      if ( !$('#filter-shift input[value=' + c.shift + ']').prop('checked') )
        continue;
      if ( !$('#filter-num input[value=' + c.num + ']').prop('checked') )
        continue;
      if ( !$('#filter-dense input[value=' + c.dense + ']').prop('checked') )
        continue;

      ans.push(c);
    }

    for ( i = 0; i < ans.length; ++i ) {
      c = ans[i];
      txt = ['<label>' + posToName(c.base, false)  + '</label>' + c.pattern,
             '音数' + c.num,
             c.dense ? '密' : '開',
             (c.shift > 0 ? '+' : '') + c.shift].join(' ');
      $('#buttons').append($('<button chord="' + c.chord.toString() +
                             '" base="' + c.base + '">' +
                            txt + '</button>'));
    }
  }

  function printAndPlay(chord_s) {
    var chord = chord_s !== '' ? chord_s.split(','): [],
        names = [], pos, i;

    $('#result .piano td').removeClass('selected');
    for ( i = 0; i < chord.length; ++i ) {
      pos = +chord[i];
      $('#result .piano td[pos=' + pos + ']').addClass('selected');
      names.push(posToName(pos));
    }
    $('#chord-input').val(names.join(','));
    playChord(chord);
  }

  function setPrefer() {
    $('#filter-base label').text(function(i) {
      return posToName(i, false);
    });
    $('#buttons label').text(function() {
      return posToName(+$(this).parent().attr('base'), false);
    });
  }

  function posToName(pos, withOct = true) {
    var v = IdxToName[pos%12],
        prefer = Math.min(+$('#prefer').val(), v.length-1);

    return withOct ? v[prefer] + (1 + Math.floor(pos / 12)) : v[prefer];
  }

  function posToFlag(pos) {
    var f = 1 << (pos % 32);
    return (pos < 32) ? [f,0,0] : ((pos < 64) ? [0,f,0]: [0,0,f]);
  }

  function flagOr(flag, f) {
    flag[0] |= f[0];
    flag[1] |= f[1];
    flag[2] |= f[2];
  }

  function flagMatch(f1, f2) {
    return (
      (f1[0] & f2[0]) === f1[0] &&
      (f1[1] & f2[1]) === f1[1] &&
      (f1[2] & f2[2]) === f1[2] );
  }

  function nameToPos(name) {
    var found = name.toUpperCase().match(/^([A-H])([FSB#♭♯]?)([1-6])$/),
        doremi, acc, oct, idx;

    if ( found === null )
      return null;

    doremi = found[1];
    acc = found[2].toLowerCase();
    oct = +found[3];

    if ( doremi === 'H' )
      doremi = 'B';
    if ( acc === 'f' || acc === 'b' )
      acc = '♭';
    else if ( acc === 's' || acc === '#' )
      acc = '♯';

    idx = NameToIdx[doremi + acc];
    return (idx === undefined) ? null : 12 * (+oct-1) + idx;
  }

  function getDist(seq, idx) {
    var dist = seq[0], len = seq.length;

    dist += 12 * Math.floor(idx/len);
    if ( idx >= 0 ) {
      if ( idx % len > 0 )
        dist += seq[idx % len];
    } else {
      if ( idx % len <= -1 )
        dist  += seq[len + idx % len]
    }
    return dist;
  }

  function generateChord(base, pattern, shift, num, dense) {
    var seq = Chords[pattern], pos_b, ans = [], i, offset, p;

    pos_b = 48+base;
    seq = (num === 3) ? seq[0] : seq[1];
    offset = 0;
    while ( pos_b + getDist(seq, num + offset - 1) >= 47 ) {
      // 一番上の音がB4より高くならないようにずらす
      --offset;
    }

    for ( i = offset; i < num + offset; ++i ) {
      p = pos_b + getDist(seq, shift + i);
      if ( !dense && i == num + offset - 2 ) {
        ans.unshift(p-12);
      } else {
        ans.push(p);
      }
    }

    return ans;
  }

  function generateAll() {
    var j, flag, f, chord,
        base, pattern, shift, num, dense;

    allChords = [];
    for ( base = 0; base < 12; ++base ) {
      for ( pattern in Chords ) {
        for ( shift = -6; shift < 7; ++shift ) {
          for ( num = 3; num < 5; ++num ) {
            for ( dense = 0; dense < 2; ++dense ) {
              chord = generateChord(base, pattern, shift, num, dense == 0);
              flag = [0,0,0];
              for ( j = 0; j < chord.length; ++j ) {
                f = posToFlag(chord[j]);
                flagOr(flag, f);
              }
              allChords.push({
                base: base,
                pattern: pattern,
                shift: shift,
                num: num,
                dense: dense == 0,
                flag: flag,
                chord: chord
              });
            }
          }
        }
      }
    }
  }

  function makeKeyboard(selector) {
    var oct, i, td, pos = 0;

    for ( oct = 0; oct < 6; ++oct ) {
      for ( i = 0; i < 12; ++i ) {
        td = $('<td>');
        td.addClass(IdxToName[i].length < 2 ? 'white' : 'black')
          .attr('pos', pos);
        if ( i === 0 )
          td.text(1+oct);
        $(selector).append(td);
        ++pos;
      }
    }
    td.addClass('last');
  }
});
