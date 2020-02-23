// ==UserScript==
// @name         Vk Max Video Quality
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @include      http*://*vk.com/*
// @grant        none
// ==/UserScript==

function SetVKMaxQuality() {
    var settingsBtn = document.getElementsByClassName("videoplayer_btn_settings")[0];
    if (settingsBtn == undefined) {
        return;
    }
    settingsBtn.click();
    var qualityBtn = document.getElementsByClassName("videoplayer_settings_menu_list_item_quality")[0];
    if (qualityBtn == undefined) {
        return;
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
        return;
    }
    MaxQualityDiv.click();
}

(function () {
    'use strict';
    window.onload = function () {
        SetVKMaxQuality();
    };


})();