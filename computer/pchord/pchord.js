'use strict'

$(function() {
  var Names = 'C,C♯,D,D♯,E,F,F♯,G,G♯,A,A♯,B'.split(',');
  var Chords = {
    /*  和音名:[<密3の列>,<密4の列>]
        <密3/密4の列> --- [s, d0, d1, d2, ...]
          s --- 最初の音の基音からの距離
          d0, d1, d2, .... --- 最初の音からの距離。最後は12

        <開の列> = <密の列>の上から二つ目の音をオクターブ下げる */
    '':      [[0, 4, 7, 12], [0, 4, 7, 12]],
    'm':     [[0, 3, 7, 12], [0, 3, 7, 12]],
    '7':     [[0, 4, 10, 12], [0, 4, 7, 10, 12]],
    'M7':    [[0, 4, 11, 12], [0, 4, 7, 11, 12]],
    'm7':    [[0, 3, 10, 12], [0, 3, 7, 10, 12]],
    'dim7':  [[3, 3, 7, 12], [0, 3, 6, 9, 12]],
    'm7b5':  [[3, 3, 7, 12], [0, 3, 6, 10, 12]],
    'aug':   [[0, 4, 8, 12], [0, 4, 8, 12]],
    'sus4':  [[0, 5, 7, 12], [0, 5, 7, 12]],
    '7sus4': [[0, 5, 10, 12], [0, 5, 7, 10, 12]],
    '6':     [[4, 3, 5, 12], [0, 4, 7, 9, 12]],
    'add9':  [[2, 2, 5, 12], [0, 2, 4, 7, 12]]
  };

  var allChords;

  var context = new AudioContext(),
      req, buffer;

  req = new XMLHttpRequest();
  req.open('GET', 'scale.ogg', true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    context.decodeAudioData(req.response, function(b) {
      buffer = b;
      $('#search .piano input').keydown(function(ev) {
        var name = $(this).val(), pos;

        if ( ev.which === 13 && name !== '' ) {
          pos = nameToPos(name);
          if ( pos !== null ) {
            selectPos($(this).parents('.keys'), pos);
            play(pos);
          }
        }
      });
      $('#chord-input').keydown(function(ev) {
        if ( ev.which === 13 )
          playChord($(this).val());
      });
      $('#do-search').click(doSearch);
      $('#loading').hide();
      $('.piano td.white, .piano td.black').click(function() {
        var input = $(this).siblings().first().find('input'),
            pos;

        input.val('');
        if ( $(this).hasClass('selected') ) {
          $(this).removeClass('selected');
        } else {
          pos = +$(this).attr('pos');
          selectPos($(this).parent(), pos);
          input.val(posToName(pos));
          play(pos);
        }
      });
    });
  };
  req.send();
  generateAll();
  $('.piano input').val('');
  $('#buttons').on('click', 'button', function(ev) {
    printAndPlay($(ev.target).attr('chord'));
  });

  function play(pos) {
    var src = context.createBufferSource();

    src.buffer = buffer;
    src.connect(context.destination);
    src.start(0, pos+0.05, 0.95);
  }

  function playChord(input) {
    var v = input.split(',');

    if ( v.length < 1 || v.length > 4 )
      return;

    $(v).each(function(i, name) {
      var pos = nameToPos(name);
      if ( pos === null || pos < 0 )
        return;
      play(pos);
    });
  }

  function selectPos(keys, pos) {
    var tds = keys.find('td[pos]');

    tds.removeClass('selected');
    tds.filter('[pos=' + pos + ']').addClass('selected');
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
      if ( !$('#filter-base>input[value=' + c.base + ']').prop('checked') )
        continue;
      if ( !$('#filter-pattern>input[value=' + c.pattern + ']')
           .prop('checked') )
        continue;
      if ( !$('#filter-shift>input[value=' + c.shift + ']').prop('checked') )
        continue;
      if ( !$('#filter-num>input[value=' + c.num + ']').prop('checked') )
        continue;
      if ( !$('#filter-dense>input[value=' + c.dense + ']').prop('checked') )
        continue;

      ans.push(c);
    }

    for ( i = 0; i < ans.length; ++i ) {
      c = ans[i];
      txt = ('' + c.base + c.pattern + ' ' +
             (c.shift > 0 ? '+' : '') +
             c.shift + ' 音数' + c.num + ' ' + (c.dense ? '密' : '開'));
      $('#buttons').append($('<button chord="' + c.chord.toString() + '">' +
                            txt + '</button>'));
    }
  }

  function printAndPlay(chord) {
    var v = chord.split(','), i, v2, pos, txt;

    v2 = [];
    $('#result .piano td').removeClass('selected');
    for ( i = 0; i < v.length; ++i ) {
      pos = +v[i];
      $('#result .piano td[pos=' + pos + ']').addClass('selected');
      v2.push(posToName(pos));
    }
    txt = v2.join(',');
    $('#chord-input').val(txt);
    playChord(txt);
  }

  function posToName(pos) {
    return Names[pos%12] + (1 + Math.floor(pos / 12));
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
        doremi, acc, oct;

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
      acc = '♯'
    if ( acc === '♯' && ( doremi === 'E' || doremi === 'B' ) ||
         acc === '♭' && ( doremi === 'F' || doremi === 'C' ) )
      return null;

    if ( acc === '♭' ) {
      doremi = String.fromCharCode(doremi.charCodeAt(0)-1);
      acc = '♯';
    }

    return 12 * (+oct-1) + Names.indexOf(doremi+acc);
  }

  function getDist(seq, idx) {
    var dist = seq[0], len = seq.length - 1;

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

    if ( seq === undefined || shift < -6 || shift > 6 || num < 3 || num > 4 )
      return null;
    base = base+'4';
    pos_b = nameToPos(base);
    if ( pos_b === null )
      return null;

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
    var i, j, flag, f, chord,
        base, pattern, shift, num, dense;

    allChords = [];
    for ( i = 0; i < Names.length; ++i ) {
      base = Names[i];
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
});
