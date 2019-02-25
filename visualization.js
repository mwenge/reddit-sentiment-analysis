/*
# Copyright (c) 2018 Robert Hogan (robhogan at gmail.com) All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#    * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#    * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
function updateDescription(subreddit) {
  var description = document.getElementById("description");
  description.textContent = subreddit.subreddit
    + " POSITIVE: " + subreddit.positive 
    + " NEGATIVE: " + subreddit.negative
    + " NEUTRAL: " + subreddit.neutral;
}

fastforward.addEventListener("animationend", function() { fastforward.style.display = "none";});

var totalComments = 0;
var intervals = [];
var events = [];
var subreddits = [];

var currentCommentFileIndex = 0;
var commentFiles = [
  "2007-12",
  "2008-12",
  "2009-12",
  "2010-12",
  "2011-12",
  "2012-12",
  "2013-12",
  "2014-12",
  "2015-05",
  "2016-11",
];
var menu = document.getElementById('menu');
for (var i = 0; i < commentFiles.length; i++) {
  var element = document.createElement('div');
  element.className = "menuItem";
  element.setAttribute('onclick', "runVisualization('" + commentFiles[i] + "');");
  element.textContent = commentFiles[i];
  menu.appendChild(element);

}

var subredditInDescription = "";
document.body.addEventListener("mouseover", function( event ) {   
  // highlight the mouseover target
  var subreddit = subreddits[event.target.id];
  if (!subreddit) {
    return;
  }
  subredditInDescription = subreddit.subreddit;
  updateDescription(subreddit);
}, false);

document.onkeydown = checkKey;
function checkKey(e) {
  e = e || window.event;
  // pause
  if (e.keyCode == '80') {
    help_menu.style.display = "none";
    menu.style.display = "none";
    intervals.forEach(function (interval) {
      window.clearInterval(interval);
    });
    intervals = [];
    var pressplay = document.getElementById("pressplay");
    pressplay.style.display = "block";
    var fastforward = document.getElementById("fastforward");
    fastforward.style.display = "none";
    return;
  }

  // resume
  if (e.keyCode == '82') {
    if (intervals.length > 0) {
      return;
    }
    intervals.push(window.setInterval(drawEvent, 50));
    var pressplay = document.getElementById("pressplay");
    pressplay.style.display = "none";
    return;
  }

  // speed up
  if (e.keyCode == '39') {
    help_menu.style.display = "none";
    menu.style.display = "none";
    if (!intervals.length) {
      return;
    }
    intervals.push(window.setInterval(drawEvent, 50));
    var fastforward = document.getElementById("fastforward");
    fastforward.style.display = "inline-block";
    fastforward.textContent = intervals.length + "x";
    return;
  }

  // slow down
  if (e.keyCode == '37') {
    help_menu.style.display = "none";
    menu.style.display = "none";
    if (intervals.length <= 2) {
      return;
    }
    var fastforward = document.getElementById("fastforward");
    fastforward.style.display = "inline-block";
    window.clearInterval(intervals.shift());
    fastforward.textContent = intervals.length + "x";
    return;
  }

  // select month
  if (e.keyCode == '77') {
    help_menu.style.display = "none";
    if (menu.style.display == "block") {
      menu.style.display = "none";
    } else {
      menu.style.display = "block";
    }
    return;
  }

  // show help
  if (e.keyCode == '191') {
    menu.style.display = "none";
    if (help_menu.style.display == "block") {
      help_menu.style.display = "none";
    } else {
      help_menu.style.display = "block";
    }
    return;
  }
}

function mapSourceToTarget(source, max_target, min_target, max_source, min_source) {
  var ratio = parseFloat(source - min_source) / parseFloat(max_source - min_source);
  var target = parseInt(ratio * (max_target - min_target) + min_target);
  return target;
}

function getElement(evt) {
  var element = document.getElementById(evt.subreddit);
  if (element) {
    return element;
  }

  element = document.createElement("div");
  element.className = 'subreddit';
  element.setAttribute('onclick', "window.open('https://reddit.com/r/" + evt.subreddit + "', '_blank')");
  element.id = evt.subreddit;
  document.body.appendChild(element);
  return element;
}

function updateSubreddit(evt) {
  var subreddit = subreddits[evt.subreddit];
  if (!subreddit) {
    subreddit = { 
      subreddit: evt.subreddit.toUpperCase(),
      totalComments : 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      totalScores : 0,
      averageScoreAsColor: { red: 0, green: 0 },
    };
  }
  subreddit.totalComments++;
  subreddit.totalScores += parseFloat(evt.score, 10);
  if (evt.score > 0) {
    subreddit.positive++;
  } else if (evt.score < 0) {
    subreddit.negative++;
  } else {
    subreddit.neutral++;
  }

  var averageScore = subreddit.totalScores / subreddit.totalComments;
  subreddit.averageScoreAsColor.green = mapSourceToTarget(averageScore, 105, 345, 1, -1);
  subreddits[evt.subreddit] = subreddit;
  return subreddit;
}

function drawEvent() {
  if (events.length < 1) {
    currentCommentFileIndex++;
    runVisualization(commentFiles[currentCommentFileIndex]);
    return;
  }
  totalComments++;

  if (typeof drawEvent.scale == "undefined") {
    drawEvent.scale = 4;
  } else if (drawEvent.scale > 2.5) {
    drawEvent.scale -= 0.001;
  }
  console.log(drawEvent.scale);

  var evt = events.shift();
  var subreddit = updateSubreddit(evt);

  var element = getElement(evt);
  element.style.backgroundColor = "hsl(" + subreddit.averageScoreAsColor.green + ", 100%, 60%)";

  if (subredditInDescription == subreddit.subreddit) {
    updateDescription(subreddit);
  }
  document.getElementById('clock-layer').textContent = evt.timestamp;

  var updatedHeight = mapSourceToTarget(subreddit.totalComments, screen.height, 1, totalComments / drawEvent.scale, 1);
  updatedHeight = Math.max(10, updatedHeight);
  var height = updatedHeight + 'px';
  if (height == element.style.height) {
    return;
  }

  if (updatedHeight > 30) {
    element.textContent = subreddit.subreddit;
    element.style.fontSize = (updatedHeight / 9) + 'px';
  } else {
    element.textContent = "";
  }

  var updatedWidth = updatedHeight;
  var width = updatedWidth + 'px';
  element.style.height = height;
  element.style.width = width;
  element.style.borderRadius = (updatedWidth / 1.25) + 'px';
  element.style.padding = (updatedWidth / 4) + 'px';

  // Sort it to the top
  if (element.previousSibling.clientHeight < element.clientHeight) {
    element.parentNode.insertBefore(element, element.previousSibling);
  }

}

class ProcessComment {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
    this.counter = 0;
    this.prevChunk = ''
  }

  /**
   * Called when a chunk is written to the log.
   */
  write(chunk) {

    this.counter += 1;
    var chunkStart = 0
    for (var i = 0; i < chunk.length; i++) {
      if (chunk[i] != 13) {
        continue
      }
      var chunkToDecode = chunk.slice(chunkStart, i);
      var inputString = new TextDecoder("utf-8").decode(chunkToDecode);
      inputString = this.prevChunk + inputString;
      if (inputString == "") {
        continue;
      }

      var stringArray = inputString.split('\t');

      var timestamp = stringArray[2];
      var subreddit = stringArray[1];
      var score = stringArray[0];

      events.push( { 
        subreddit: subreddit,
        score: score,
        timestamp: timestamp,
      } );

      chunkStart = i + 1;
      this.prevChunk = '';
      i++;
    }
    var chunkToDecode = chunk.slice(chunkStart);
    var inputString = new TextDecoder("utf-8").decode(chunkToDecode);
    this.prevChunk = inputString;
  } /**
     * Called when the stream is closed.
     */
  close() {
  }
}

function processCommentData(name, rs) {
  const [rs1, rs2] = rs.tee();
  rs2.pipeTo(new WritableStream(new ProcessComment(name))).catch(console.error);
  return rs1;
}

function runVisualization(yearAndMonth) {
  intervals.forEach(function (interval) {
    window.clearInterval(interval);
  });
  intervals = [];
  events = [];
  subreddits = [];
  totalComments = 0;
  intervals.push(window.setInterval(drawEvent, 50));

  menu.style.display = "none";
  fastforward.style.display = "none";
  pressplay.style.display = "none";
  var matches = document.getElementsByClassName("subreddit");
  while (matches.length > 0) {
    var element = matches[0];
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  // Fetch the original image
  fetch('comments/RC_' + yearAndMonth + '.bz2.txt')
  // Retrieve its body as ReadableStream
    .then(response => response.body)
  // Log each fetched Uint8Array chunk
    .then(rs => processCommentData('comments', rs))
}

