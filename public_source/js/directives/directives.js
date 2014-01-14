var sockets = require("./socket");

angular.module("GifChat.directives", [])
    .factory("SocketService", function() {
        return sockets;
    })
    .directive("navbar", [function() {
        return {
            restrict: "E",
            scope: {},
            replace: true,
            templateUrl: "/partials/directives/navbar_directive.html",
            link: function(scope, element) {

            },
            controller: ["$scope", "User", function($scope, User) {
                console.log("NavController initialized!");
                $scope.user = User;
                $scope.logout = function() {
                    User.name = "[anonymous]";
                }
            }]
        };
    }])
    .directive("messageRenderer", [function() {
        return {
            restrict: "E",
            scope: {
                message: "="
            },
            templateUrl: "/partials/directives/message_renderer_directive.html",
            link: function(scope, element) {
                var img = document.createElement("img");
                img.src = scope.message.image;
                img.width = 160;
                img.height = 120;

                element.prepend(img);
                // this would be a good place to dispatch a notification!
            },
            controller: ["$scope", function($scope) {

            }]
        }
    }])
    .directive("chat", ["SocketService", "Camera", "VideoShooter", "User", function ($SocketService, Camera, $VideoShooter, User) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/directives/chat_directive.html",
            replace: true,
            link: function(scope, element) {
                // first, initialize video feed.
                var shooter;

                if (Camera.videoElement) {
                    shooter = new $VideoShooter(Camera.videoElement);
                } else {
                    Camera.register(function(videoElement) {
                        shooter = new $VideoShooter(videoElement);
                    });
                }


                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {
                    scope.appendMessage(JSON.parse(e.data));
                    scope.$apply();
                };

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                };

                scope.postNewMessage = function(message, callback) {
                    var image;
                    shooter.getShot(function(image) {
                        scope.socket.send(JSON.stringify({user: User.name, text: message, image: image}));
                        callback();
                    }, 20, 0.1, function(progress) {
                        console.log("Progress: " + progress);
                    });
                };

                scope.appendMessage({user: "[root]", text: "---> You just joined the chat!", image: "http://readjack.files.wordpress.com/2012/02/cute_bunny.jpg"});
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
