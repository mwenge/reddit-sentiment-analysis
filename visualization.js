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
															+ " positive: " + subreddit.positive 
															+ " negative: " + subreddit.negative
															+ " neutral: " + subreddit.neutral;
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

var interval = null;
document.onkeydown = checkKey;
function checkKey(e) {
  e = e || window.event;
  if (e.keyCode == '80') {
    // up arrow
		window.clearInterval(interval);
		var pressplay = document.getElementById("pressplay");
		pressplay.style.display = "block";
  } else if (e.keyCode == '82') {
		interval = window.setInterval(drawEvent, 50);
		var pressplay = document.getElementById("pressplay");
		pressplay.style.display = "none";
    // down arrow
  }
}

var events = [];
var subreddits = [];

function mapSourceToTarget(source, max_target, min_target, max_source, min_source) {
  var ratio = parseFloat(source - min_source) / parseFloat(max_source - min_source);
  var target = parseInt(ratio * (max_target - min_target) + min_target);
  return target;
}

function removeElement(evt) {
  var element = evt.target;
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

function fadeElement(evt) {
  var element = evt.target;
  if (element.parentNode) {
    element.className = 'animation';
    element.style.animationDuration = animationDuration + 's';
  }
  element.addEventListener("animationend", removeElement);
}

function getElement(evt) {
  var element = document.getElementById(evt.subreddit);
  if (element) {
    return element;
  }

  element = document.createElement("div");
  element.className = 'subreddit';
  element.id = evt.subreddit;
  document.body.appendChild(element);
  return element;
}

function updateSubreddit(evt) {
  var subreddit = subreddits[evt.subreddit];
  if (!subreddit) {
    subreddit = { 
      subreddit: evt.subreddit,
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

var totalComments = 0;
function drawEvent() {
  if (events.length < 1) {
    return;
  }
  totalComments++;

  var evt = events.shift();
  var subreddit = updateSubreddit(evt);

  var element = getElement(evt);
  element.style.backgroundColor = "hsl(" + subreddit.averageScoreAsColor.green + ", 100%, 60%)";

	if (subredditInDescription == subreddit.subreddit) {
		updateDescription(subreddit);
	}
  document.getElementById('clock-layer').textContent = evt.timestamp;

  var updatedHeight = mapSourceToTarget(subreddit.totalComments, screen.height, 1, totalComments / 4.5, 1);
  var height = Math.max(10, updatedHeight) + 'px';
	if (height == element.style.height) {
			console.log("skipping");
			return;
	}

	if (updatedHeight > 30) {
		element.textContent = subreddit.subreddit;
		element.style.fontSize = (updatedHeight / 9) + 'px';
	} else {
		element.textContent = "";
	}

  var updatedWidth = updatedHeight;
  var width = Math.max(10, updatedWidth) + 'px';
	element.style.height = height;
	element.style.width = width;

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

function processEvents() {
	for (var i = 0; i < 200; i++) {
		drawEvent();
	}
}

function runVisualization() {
	interval = window.setInterval(drawEvent, 50);

  // Fetch the original image
  fetch('250-sentiments.txt')
  // Retrieve its body as ReadableStream
    .then(response => response.body)
  // Log each fetched Uint8Array chunk
    .then(rs => processCommentData('comments', rs))
}

