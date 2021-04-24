// ==UserScript==
// @name         HLS video Getter
// @namespace    http://tampermonkey.net/
// @version      0.4
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
        "host": "kanald.com.tr",
        "request": ".*1000/prog_index.m3u8.*",
    },{
        "host": "discoveryplus.se",
        "request": ".*playlist.m3u8.*",
    },{
        "host": "mycdn.me",
        "request": ".*expires=.*id=.*&",
    },
];
window.savedLinks = [];

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
    for (var i = 0; i < LinkSearchPattern.length; i++) {
        var hostPattern = LinkSearchPattern[i].host;
        if (window.location.href.match(hostPattern) != undefined) {
            var requestPattern = LinkSearchPattern[i].request;
            var matches = link.match(requestPattern);
            if (matches != undefined) {
                return matches[0];
            }
        }
    }
    return false;
}


function CheckLinkForMatch(link){
    //console.log(link)
    var linkState = seekPattern(link);
    if (linkState != false && savedLinks.includes(linkState) == false) {
        console.log("LINKLOG>" + link);
        savedLinks.push(link);
    }
}

(function () {
    'use strict';
    console.log("HLS VIDEO GETTER -> INJECT DONE\n" +
                "Functions: list()\n"+
                "Variables: savedLinks\n");
    window.list = function(){
        console.log(savedLinks.join("\n"));
    }
    addXMLRequestCallback(function (xhr) {
        xhr.onload = function(){
            CheckLinkForMatch(xhr.responseURL);
        }
    });
})();