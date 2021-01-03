// ==UserScript==
// @name         Viafree anti adblocker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        http*://*viafree.se/*
// @grant        none
// ==/UserScript==

function findByKey(obj, key) {
    if(obj==null || obj==undefined ){
        return;
    }
    if(obj.constructor === Object || obj.constructor === Array){
        var keys = Object.keys(obj);
        for(i in keys){
            var i = keys[i];
            if(key == i){
                return obj; 
            }else{
                var test = findByKey(obj[i], key);
                if(test != undefined){
                    return test;
                }
            }
        }
    }else if(obj == key){
        return key;
    }
    return;

}

(function () {
    'use strict';
    if (window.top != window.self){
        return;
    }
    window.onload = function () {
        findByKey(window.__initialState__, "adBlockerBlocker")['adBlockerBlocker']['enabled'] = false;
    };
})();