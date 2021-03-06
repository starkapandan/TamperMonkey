// ==UserScript==
// @name         html5VideoControls
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       You
// @run-at document-idle
// @match        *://*.*.*/*.mp4
// @grant        none
// ==/UserScript==


var app_tm = {
    //app specific settings

    //browser specific variables

    //browser specific functions
    Restart: function () {
        init();
    },

    //standard props
    _title: "titleHere",
    DEBUG_MODE: false,
    log: function (...params) {
        console.log(`TM[${this._title}]>`, ...params);
    },
    debug: function (...params) {
        if (this.DEBUG_MODE) {
            this.log(...params)
        }
    },
    debug_warn: function (...params) {
        if (this.DEBUG_MODE) {
            console.warn(`TM[${this._title}]>`, ...params)
        }
    },
    sleep: async function (ms) {
        await new Promise(r => setTimeout(r, ms));
    }
};

function init() {
    var video = document.querySelector('video'); //video element
    window.addEventListener('keydown', function (event) {
        if (event.key == "ArrowLeft") {
            //Left
            video.currentTime -= 3;
        } else if (event.key == "ArrowRight") {
            //Right
            video.currentTime += 3;
        }
    });
}

(function () {
    'use strict';
    if (window.top != window.self) {
        return;
    }
    window.app_tm = app_tm;
    console.log(`${app_tm._title} -> INJECT DONE\n` +
        "Functions: [app_tm.Restart(), ]\n" +
        "Variables: []\n");
    init();
})();

