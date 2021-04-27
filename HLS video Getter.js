// ==UserScript==
// @name         HLS video Getter
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  try to take over the world!
// @author       You
// @include        http*://*kanald.com.tr/*
// @include        http*://*vk.com/*
// @include        http*://*discoveryplus.se/*
// @grant        none
// ==/UserScript==


//host, just check if matches current website
//request, check if matches AND returned the matched link!
var LinkSearchPattern = [
    {
        host: "kanald.com.tr",
        request: [
            { pattern: ".*1000/prog_index.m3u8.*",}
        ],
    }, {
        host: "discoveryplus.se",
        request: [
            { pattern: ".*playlist.m3u8.*", },
        ],
    }, {
        host: "vk.com",
        request: [
            { pattern: ".*mycdn.*type=5.*&id=.*&", title: "1080p" },
            { pattern: ".*mycdn.*type=3.*&id=.*&", title: "720p" },
            { pattern: ".*mycdn.*type=2.*&id=.*&", title: "480p" },
            { pattern: ".*mycdn.*type=1.*&id=.*&", title: "360p" },
            { pattern: ".*mycdn.*expires=.*&id=.*&", title: "others" },
            { pattern: ".*hls.*\.m3u8", title: "m3u8 file" },
        ],
    },
];
var activeHostPatterns = undefined;
var savedLinks = [];

function addXMLRequestCallback(callback) {
    var oldSend, i;
    if (XMLHttpRequest.callbacks) {
        var x = $("something appearance")
        // we've already overridden send() so just add the callback
        XMLHttpRequest.callbacks.push(callback);
    } else {
        // create a callback queue
        XMLHttpRequest.callbacks = [callback];
        // store the native send()
        oldSend = XMLHttpRequest.prototype.send;
        // override the native send()
        XMLHttpRequest.prototype.send = function () {
            // process the callback queue
            // the xhr instance is passed into each callback but seems pretty useless
            // you can't tell what its destination is or call abort() without an error
            // so only really good for logging that a request has happened
            // I could be wrong, I hope so...
            // EDIT: I suppose you could override the onreadystatechange handler though
            for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
                XMLHttpRequest.callbacks[i](this);
            }
            // call the native send()
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
        if (matches != undefined) {
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
        if (window.location.href.match(hostPattern) != undefined) {
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