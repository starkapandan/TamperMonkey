// ==UserScript==
// @name         HLS video Getter
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  try to take over the world!
// @author       You
// @match        *://*.kanald.com.tr/*
// @match        *://*.vk.com/*
// @match        *://*.discoveryplus.se/*
// @match        *://*.pornhub.com/*
// @match        *://*.brazzers.com/*
// @grant        none
// ==/UserScript==


//host, just check if matches current browser url of window.location.hostname
//request, check if matches AND returned the captured part of the link!
var LinkSearchPattern = [
    {
        host: /kanald\.com\.tr/i,
        request: [
            { pattern: /1000\/prog_index.m3u8/i }
        ],
    }, {
        host: /discoveryplus\.se/i,
        request: [
            { pattern: /playlist.m3u8/i, },
        ],
    }, {
        host: /vk\.com/i,
        request: [
            { pattern: /mycdn\.me\/.*type=5/i, replace: [{ find: /bytes.*?(&|$)/i, replaceWith: "$1" }], title: "1080p" },
            { pattern: /mycdn\.me\/.*type=3/i, replace: [{ find: /bytes.*?(&|$)/i, replaceWith: "$1" }], title: "720p" },
            { pattern: /mycdn\.me\/.*type=2/i, replace: [{ find: /bytes.*?(&|$)/i, replaceWith: "$1" }], title: "480p" },
            { pattern: /mycdn\.me\/.*type=1/i, replace: [{ find: /bytes.*?(&|$)/i, replaceWith: "$1" }], title: "360p" },
            { pattern: /mycdn\.me\/.*?id=/i, replace: [{ find: /bytes.*?(&|$)/i, replaceWith: "$1" }], title: "others" },
            { pattern: /hls.*\.m3u8/i, title: "m3u8 file" },
        ],
    },
    {
        host: /pornhub\.com/i,
        request: [
            { pattern: /index-f1.*\.m3u8/i, title: "F1 best quality" },
            { pattern: /index-f[2-9].*\.m3u8/i, title: "NOT best quality" },
        ],
    },
    {
        host: /brazzers\.com/i,
        request: [
            { pattern: /index-f4.*\.m3u8/i, title: "F4 best quality" },
            { pattern: /index-f[12356].*\.m3u8/i, title: "NOT best quality" },
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
        var requestConfig = activeHostPatterns[i];
        if (link.match(requestConfig.pattern)) {
            var matchedLink = link
            if (requestConfig.replace) {
                for (const replacementConfig of requestConfig.replace) {
                    matchedLink = matchedLink.replace(replacementConfig.find, replacementConfig.replaceWith);
                }
            }
            var returnPack = { matched: matchedLink, title: "" };
            if (requestConfig.title) {
                returnPack.title = requestConfig.title;
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
    window.clearList = function () {
        savedLinks = [];
    }
    window.savedLinks = savedLinks;
    addXMLRequestCallback(function (xhr) {
        xhr.onload = function () {
            CheckLinkForMatch(xhr.responseURL);
        }
    });
})();