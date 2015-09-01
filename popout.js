var rem = $($("#remainingTime")[0]);
var ela = $($("#elapsedTime")[0]);
var progressBar = $($("#progressBar")[0]);
var progressMiddle = $($("#progressMiddle")[0]);

var formatTime = function(seconds) {
    return String(Math.floor(seconds / 60)) + ':' + (seconds % 60 < 10 ? '0' : '') + String(seconds % 60);
}

var showProgress = function() {
    var elapsed = parseInt(ela.text().split(":")[0]) * 60 + parseInt(ela.text().split(":")[1]);
    var remaining = parseInt(rem.text().split(":")[0]) * -60 + parseInt(rem.text().split(":")[1]);
    if (remaining > 0) {
        elapsed++;
        remaining--;
        rem.text('-' + formatTime(remaining));
        ela.text(formatTime(elapsed));

        var percentDone = elapsed / (elapsed + remaining);
        progressMiddle.width(progressBar.width() * percentDone);
    }

}

setInterval(showProgress, 1000);