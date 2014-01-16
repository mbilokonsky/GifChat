var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");

angular.module("GifChat.services", [])
    .value("version", "0.1")
    .service("Camera", function() {
        var listeners = [];
        var camera = {
            videoElement: null,
            stream: null,
            register: function(callback) {
                listeners.push(callback);
            }
        }

        var videoElement;
        videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.muted = true;

        window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

        navigator.getMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

        navigator.getMedia({ video: true, audio: true }, function (stream) {

            camera.streamUrl = window.URL.createObjectURL(stream);
            camera.videoElement = videoElement;
            camera.stream = stream;
            camera.dimensions = {width: videoElement.videoWidth || 640, height: videoElement.videoHeight || 480};
            videoElement.play();

            videoElement.src = camera.streamUrl;

            listeners.forEach(function(callback) {
                callback(camera.videoElement);
            });

        }, function(err) {

        });

        return camera;
    })
    .service("VideoShooter", function() {
        return function(videoElement) {
            this.getShot = function(callback, numFrames, interval, progressCallback) {
                numFrames = numFrames !== undefined ? numFrames : 3;
                interval = interval !== undefined ? interval : 0.1;

                var pendingFrames = numFrames;
                var ag = new AnimatedGif({workerPath: '/js/worker.js'});
                ag.setSize(160, 120);
                ag.setDelay(interval);
                captureFrame();

                function captureFrame() {
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
    })
    .service("User", function() {
        var user = {
            name: "[anonymous]"
        };
        return user;
    });