var sockets = require("./socket");
var gumHelper = require("../../bower_components/gumhelper/gumhelper.js");
var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");

angular.module("GifChat.directives", [])
    .factory("SocketService", function() {
        return sockets;
    })
    .directive("chat", ["SocketService", "VideoShooter", function ($SocketService, $VideoShooter) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/directives/chat_directive.html",
            replace: true,
            link: function(scope, element) {
                // first, initialize video feed.
                var shooter;
                gumHelper.startVideoStreaming(function(err, stream, videoElement, width, height) {
                    if (err) {
                        alert("Oh noes!");
                        console.error(err);
                        return;
                    }

                    addVideo(videoElement);
                });

                function addVideo(videoElement) {
                    console.log("")
                    $(element.children()[3]).append(videoElement);
                    shooter = new $VideoShooter(videoElement);
                }

                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {

                    scope.appendMessage(e.data);
                    scope.$apply();
                    // TODO do a notification here
                };

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                };

                scope.postNewMessage = function(message, callback) {
                    var image;
                    shooter.getShot(function(image) {
                        var img = document.createElement("img");
                        img.src = image;
                        element.append(img);
                        console.log("Image composed and appended!");

                        console.log("Now posting message!");
                        scope.socket.send(message);

                        console.log("Now executing callback:");
                        callback();
                    }, 20, 0.1, function(progress) {
                        console.log("Progress: " + progress);
                    });
                };

                scope.appendMessage("---> You just joined the chat!");
            },
            controller: ["$scope", function($scope) {
                $scope.submit = function() {
                    $scope.postNewMessage($scope.messageToSend, function(err) {
                        if (err) {
                            // TODO
                        }
                        $scope.messageToSend = "";
                    });

                }
            }]
        }
    }]);
