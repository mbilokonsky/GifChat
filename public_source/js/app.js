// This will include ./node_modules/angular/angular.js
// and give us access to the `angular` global object.
require('angular/angular');
require('angular-route/angular-route');
require("./services/services");
require("./filters/filters");
require("./directives/directives");

// Create your app
angular.module('GifChat', ['ngRoute', "GifChat.services", "GifChat.filters", "GifChat.directives"])
    .config(['$routeProvider', function($routeProvider) {

    // Specify routes to load our partials upon the given URLs
    $routeProvider.when('/view1', {templateUrl: 'partials/partial1.html'});
    $routeProvider.when('/view2', {templateUrl: 'partials/partial2.html'});
    $routeProvider.otherwise({redirectTo: '/view1'});
}]);