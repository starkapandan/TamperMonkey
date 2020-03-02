// ==UserScript==
// @name         Vk Max Video Quality
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @include      http*://*vk.com/*
// @grant        none
// ==/UserScript==

var lastDocument = "";

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
        var quality = parseInt(qualityDivs[i].dataset["value"])
        if (quality > MaxQuality) {
            MaxQualityDiv = qualityDivs[i];
            MaxQuality = quality;
        }
    }
    if (MaxQualityDiv == undefined) {
        return 0;
    }
    MaxQualityDiv.click();
    return 1;
}

async function ListenToDocumentChanges() {
    while (true) {
        console.log("<Iteration>")
        if (lastDocument != document.location) {
            lastDocument = document.location;
            var status = SetVKMaxQuality();
            if (status == 1) {
                console.log("Set Quality!")
                break;
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log("END")
}

(function () {
    'use strict';
    window.onload = function () {
        ListenToDocumentChanges();
    };
})();