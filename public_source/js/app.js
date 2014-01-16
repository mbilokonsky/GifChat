// This will include ./node_modules/angular/angular.js
// and give us access to the `angular` global object.
require('../bower_components/angular/angular.js');
require("../bower_components/angular-bootstrap/ui-bootstrap-tpls.js");
require("../bower_components/angular-ui-router/release/angular-ui-router.js");

var $ = require("../bower_components/jquery/jquery.min.js");

require("./services/services");
require("./filters/filters");
require("./directives/directives");

// Create your app
var app = angular.module('GifChat', ["ui.bootstrap", "ui.router", "GifChat.services", "GifChat.filters", "GifChat.directives"], function() {
    console.log("angular app initialized!");
});

app.config(function($stateProvider, $urlRouterProvider) {
    console.log("--> now configuring routes!");
    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state("home", {
            url: "/",
            templateUrl: "partials/home.html"
        })
        .state("chat", {
            url: "/chat",
            templateUrl: "partials/chat.html"
        })
        .state("video", {
            url: "/video",
            templateUrl: "partials/video.html",
            controller: function($scope) {
                $scope.inChannel = false;
                $scope.moveToChannel = function() {
                    console.log("OK I moved to a channel!");
                    $scope.inChannel = true;
                }
            }
        })
        .state("videochannel", {
            url: "/video/channel/:session",
            template: "<video_chat session=\"{{channel}}\"></video_chat>",
            controller: function($scope, $stateParams) {
                $scope.channel = $stateParams.session;
                console.log("OK we made it!");
                console.log($scope.channel);
                $scope.inChannel = true;
            }
        })
        .state("about", {
            url: "/about",
            templateUrl: "partials/about.html"
        })
        .state("login", {
            url: "/login",
            templateUrl: "partials/login.html",
            controller: ["$scope", "User", function($scope, User) {
                $scope.userName = "Al";
                $scope.user = User;

                $scope.setName = function() {
                    console.log("Setting username!");
                    User.name = $scope.userName;
                    $scope.userName = "";
                }
            }]
        })
});