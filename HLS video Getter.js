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


var LinkSearchPattern = ["kanald.com.tr<!>1000/prog_index.m3u8", "vk.com<!>.m3u8", "discoveryplus.se<!>playlist.m3u8"];
savedLinks = [];

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
        var pattern = LinkSearchPattern[i].split("<!>");
        if (window.location.href.includes(pattern[0]) == true) {
            if (link.includes(pattern[1]) == true) {
                return true;
            }
        }
    }
    return false;
}


function CheckLinkForMatch(link){
    //console.log(link)
    if (seekPattern(link) == true && savedLinks.includes(link) == false) {
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