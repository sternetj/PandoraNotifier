var rem = $($("#remainingTime")[0]);
var ela = $($("#elapsedTime")[0]);
var progressBar = $($("#progressBar")[0]);
var progressMiddle = $($("#progressMiddle")[0]);
var isPlaying = !($($("#playButton")[0]).hasClass("hidden"));
var skipping = false;

var formatTime = function(seconds) {
    return String(Math.floor(seconds / 60)) + ':' + (seconds % 60 < 10 ? '0' : '') + String(seconds % 60);
}

var showProgress = function() {
	var isPlaying = $($("#playButton")[0]).hasClass("hidden");
    var elapsed = parseInt(ela.text().split(":")[0]) * 60 + parseInt(ela.text().split(":")[1]);
    var remaining = parseInt(rem.text().split(":")[0]) * -60 + parseInt(rem.text().split(":")[1]);
    if (isPlaying && !skipping){
    if (remaining > 0) {
	        elapsed++;
	        remaining--;
	        rem.text('-' + formatTime(remaining));
	        ela.text(formatTime(elapsed));

	        var percentDone = elapsed / (elapsed + remaining);
	        progressMiddle.width(progressBar.width() * percentDone);
	    }else{
	    	progressMiddle.width(0);
	    }
	}

}

showProgress();
setInterval(showProgress, 1000);

$("body").mouseover(function(){
	$($("#playbackControl")[0]).addClass("show");
});

$("body").mouseenter(function(){
    $($("#playbackControl")[0]).addClass("show");
});

$("body").mousemove(function(){
    $($("#playbackControl")[0]).addClass("show");
});
$("body").mouseleave(function(){
    $($("#playbackControl")[0]).removeClass("show");
});
$("body").mouseout(function(){
    $($("#playbackControl")[0]).removeClass("show");
});

var imageFirstLoad = true;
$("#albumImage").load(function() {
	skipping = false;
	if (imageFirstLoad){
		document.body.style.backgroundImage = "url('" + $("#albumImage")[0].src + "')";
		imageFirstLoad = false;
		return;
	}
	$("#albumImage").addClass("animate").delay(1500).queue(function(){
	    $(this).removeClass("animate").dequeue();
	    document.body.style.backgroundImage = "url('" + $("#albumImage")[0].src + "')";
	});
});

$("#skipButton, #dislikeButton, #pauseButton").click(function () {
	skipping = true;
});

$("#playButton").click(function () {
	skipping = false;
});