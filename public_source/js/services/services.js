var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");

angular.module("GifChat.services", [])
    .value("version", "0.1")
    .service("VideoShooter", function() {
        return function(videoElement) {
            this.getShot = function(callback, numFrames, interval, progressCallback) {
                numFrames = numFrames !== undefined ? numFrames : 3;
                interval = interval !== undefined ? interval : 0.1;

                var pendingFrames = numFrames;
                var ag = new AnimatedGif({workerPath: '/js/worker.js'});
                ag.setSize(videoElement.videoWidth, videoElement.videoHeight);
                ag.setDelay(interval);

                console.log(ag);

                captureFrame();

                function captureFrame() {
                    console.log("About to capture frame.");
                    console.log(videoElement);
                    console.log(ag);

                    ag.addFrame(videoElement);
                    pendingFrames--;

                    progressCallback((numFrames - pendingFrames) / numFrames);

                    if (pendingFrames > 0) {
                        setTimeout(captureFrame, interval * 1000);
                    } else {
                        ag.getBase64GIF(callback);
                    }
                }
            }
        }
    });