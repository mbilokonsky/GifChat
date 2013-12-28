var sockets = require("./socket");


angular.module("GifChat.directives", [])
    .factory("SocketService", function() {
        return sockets;
    })
    .directive("chat", ["SocketService", function ($SocketService) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/chat.html",
            replace: true,
            link: function(scope, element) {
                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {
                    console.log("Woo:");
                    console.log(e);
                    scope.appendMessage(e.data);
                    scope.$apply();
                }

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                };

                scope.appendMessage("You just joined the chat!");
            },
            controller: ["$scope", function($scope) {
                $scope.submit = function() {
                    $scope.socket.send($scope.messageToSend);
                    $scope.messageToSend = "";
                }
            }]
        }
    }]);
