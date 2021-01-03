// ==UserScript==
// @name         image Crawler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      *://*/*
// @grant        none
// ==/UserScript==


(function () {
    'use strict';
    window.onload = function () {
        var imageList = document.getElementsByTagName("img");
        imageList.forEach(function(img){
            console.log(img.getAttribute('src'));
        })
    };
})();