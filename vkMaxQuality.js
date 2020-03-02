// ==UserScript==
// @name         Vk Max Video Quality
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  try to take over the world!
// @author       You
// @include      http*://*vk.com/*
// @grant        none
// ==/UserScript==

var lastDocument = "";
var lastQuality = 0;

function SetVKMaxQuality() {
    var settingsBtn = document.getElementsByClassName("videoplayer_btn_settings")[0];
    if (settingsBtn == undefined) {
        return 0;
    }
    settingsBtn.click();
    var qualityBtn = document.getElementsByClassName("videoplayer_settings_menu_list_item_quality")[0];
    if (qualityBtn == undefined) {
        return 0;
    }
    qualityBtn.click();
    var qualityDivs = document.getElementsByClassName("videoplayer_settings_menu_sublist_item");

    var MaxQualityDiv = undefined;
    var MaxQuality = 0;
    for (var i = 0; i < qualityDivs.length; i++) {
        var quality = parseInt(qualityDivs[i].dataset.value)
        if (quality > MaxQuality) {
            MaxQualityDiv = qualityDivs[i];
            MaxQuality = quality;
        }
    }
    if (MaxQualityDiv == undefined) {
        return 0;
    }
    MaxQualityDiv.click();
    lastQuality = MaxQuality;
    return 1;
}

async function ListenToDocumentChanges() {
    while (true) {
        if (lastDocument != document.location.href) {
            lastDocument = document.location.href;
            var status = SetVKMaxQuality();
            if (status == 1) {
                if(lastQuality == 1080){
                    break;
                }
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }
}

(function () {
    'use strict';
    if (window.top != window.self){
        return;
    }
    window.onload = function () {
        ListenToDocumentChanges();
    };
})();