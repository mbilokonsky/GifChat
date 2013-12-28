// This will include ./node_modules/angular/angular.js
// and give us access to the `angular` global object.
require('../bower_components/angular/angular.js');
require("../bower_components/angular-bootstrap/ui-bootstrap-tpls.js");

require("./services/services");
require("./filters/filters");
require("./directives/directives");

// Create your app
angular.module('GifChat', ["ui.bootstrap", "GifChat.services", "GifChat.filters", "GifChat.directives"]);
