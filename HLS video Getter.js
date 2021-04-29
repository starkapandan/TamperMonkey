// ==UserScript==
// @name         HLS video Getter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        *://*kanald.com.tr/*
// @match        *://*vk.com/*
// @match        *://*discoveryplus.se/*
// @match        *://*pornhub.com*/*
// @grant        none
// ==/UserScript==


//host, just check if matches current browser url of window.location.hostname
//request, check if matches AND returned the captured part of the link!
var LinkSearchPattern = [
    {
        host: /kanald\.com\.tr/,
        request: [
        { pattern: /.*1000\/prog_index.m3u8.*/}
        ],
    }, {
        host: /discoveryplus\.se/,
        request: [
            { pattern: /.*playlist.m3u8.*/, },
        ],
    }, {
        host: /vk\.com/,
        request: [
            { pattern: /.*mycdn.*type=5.*&id=.*&/, title: "1080p" },
            { pattern: /.*mycdn.*type=3.*&id=.*&/, title: "720p" },
            { pattern: /.*mycdn.*type=2.*&id=.*&/, title: "480p" },
            { pattern: /.*mycdn.*type=1.*&id=.*&/, title: "360p" },
            { pattern: /.*mycdn.*expires=.*&id=.*&/, title: "others" },
            { pattern: /.*hls.*\.m3u8/, title: "m3u8 file" },
        ],
    },
    {
        host: /pornhub\.com/,
        request: [
            { pattern: /.*index-f1.*\.m3u8.*/, title: "f1 hopefully best quality" },
        ],
    },
];
var activeHostPatterns = undefined;
var savedLinks = [];

function addXMLRequestCallback(callback) {
    var oldSend, i;
    if (XMLHttpRequest.callbacks) {
        var x = $("something appearance")
        XMLHttpRequest.callbacks.push(callback);
    } else {
        XMLHttpRequest.callbacks = [callback];
        oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
                XMLHttpRequest.callbacks[i](this);
            }
            oldSend.apply(this, arguments);
        }
    }
}


function is404(link) {
    var http = new XMLHttpRequest();
    http.open('HEAD', link, false);
    http.send();
    if (http.status == 404) {
        return true;
    } else {
        return false;
    }
}


function seekPattern(link) {
    for (var i = 0; i < activeHostPatterns.length; i++) {
        var requestPattern = activeHostPatterns[i].pattern;
        var matches = link.match(requestPattern);
        if (matches) {
            var returnPack = {matched: matches[0], title: ""};
            if("title" in activeHostPatterns[i]){
                returnPack.title = activeHostPatterns[i].title;
            }
            return returnPack;
        }
    }

    return false;
}


function CheckLinkForMatch(link) {
    //console.log(link)
    var linkState = seekPattern(link);
    if (linkState != false && savedLinks.includes(linkState.matched) == false) {
        console.log(`LINKLOG>${linkState.title}\n${linkState.matched}`);
        savedLinks.push(linkState.matched);
    }
}

(function () {
    'use strict';
    if (window.top != window.self) {
        return;
    }

    for (var i = 0; i < LinkSearchPattern.length; i++) {
        var hostPattern = LinkSearchPattern[i].host;
        if (window.location.hostname.match(hostPattern) != undefined) {
            activeHostPatterns = LinkSearchPattern[i].request;
            break;
        }
    }
    if (activeHostPatterns == undefined) {
        console.log("TM: No matched host pattern...");
        return;
    }
    console.log("HLS VIDEO GETTER -> INJECT DONE\n" +
        "Functions: list(), clearList()\n" +
        "Variables: savedLinks\n");
    window.list = function () {
        console.log(savedLinks.join("\n"));
    }
    window.clearList = function(){
        savedLinks = [];
    }
    window.savedLinks = savedLinks;
    addXMLRequestCallback(function (xhr) {
        xhr.onload = function () {
            CheckLinkForMatch(xhr.responseURL);
        }
    });
})();