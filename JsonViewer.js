// ==UserScript==
// @name         JsonViewer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @include       *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    if (window.top != window.self){
        return;
    }
    window.onload = function () {
        ListenToDocumentChanges();
    };
})();