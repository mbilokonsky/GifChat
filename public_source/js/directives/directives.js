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
    .directive("chat", ["SocketService", "Camera", "VideoShooter", "User", "$http", function ($SocketService, Camera, $VideoShooter, User, $http) {
        var shooter;
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/directives/chat_directive.html",
            replace: true,
            link: function(scope, element) {
                // first, initialize video feed.

                if (shooter) {
                    showPreview(Camera);
                } else if (Camera.videoElement) {
                    shooter = new $VideoShooter(Camera.videoElement);
                    showPreview(Camera);
                } else {
                    Camera.register(function(videoElement) {
                        shooter = new $VideoShooter(videoElement);
                        showPreview(Camera);
                    });
                }


                function showPreview(camera) {
                    element.append(camera.videoElement);
                }

                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {
                    scope.appendMessage(JSON.parse(e.data));
                    scope.$apply();
                };

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                    while (scope.messages.length > 30) {
                        scope.messages.shift();
                    }
                };

                var previousProgress = 0;
                function updateProgress(percent) {
                    if (percent == 1) {
                        previousProgress = 0;
                    }
                }

                scope.postNewMessage = function(message, callback) {
                    shooter.getShot(function(image) {
                        console.log("Shot taken, now posting!");
                        var img = image.substr(22);
                        $http.post("/upload", JSON.stringify({payload: img}))
                            .success(function(result) {
                                scope.socket.send(JSON.stringify({user: User.name, text: message, image: result.fileName}));
                                callback();
                            })
                            .error(function(err) {
                                console.err(err);
                                scope.socket.send(JSON.stringify({user: User.name, text: message, image: "/images/error.gif"}));
                            });
                    }, 10, 0.2, updateProgress);
                };

                scope.appendMessage({user: "[root]", text: "---> You're in the chat now, be prepared!", image: "/images/local.gif"});
            },
            controller: ["$scope", function($scope) {
                $scope.inputEnabled = true;
                $scope.submit = function() {
                    $scope.inputEnabled = false;
                    $scope.messageToSend = "";
                    $scope.postNewMessage($scope.messageToSend, function(err) {
                        if (err) {
                            // TODO
                        }
                        $scope.inputEnabled = true;
                    });

                }
            }]
        }
    }]);
