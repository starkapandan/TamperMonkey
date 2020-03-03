// ==UserScript==
// @name         Vk Max Video Quality
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      http*://*youtube.com/*
// @grant        none
// ==/UserScript==

var lastDocument = "";
var lastQuality = 0;

function SetMaxQuality() {
    var settingsBtn = document.getElementsByClassName("ytp-settings-button")[0];
    if (settingsBtn == undefined) {
        return 0;
    }
    settingsBtn.click();
    var items = document.getElementsByClassName("ytp-menuitem-label");
    if (items == undefined) {
        return 0;
    }
    var qualityBtn;
    for (var i = 0; i < items.length; i++) {
        if (items[i].innerText.includes("alit") == true) {
            qualityBtn = items[i]
        }
    }
    if(qualityBtn == undefined){
        return 0;
    }
    qualityBtn.click();
    var qualityDivs = document.getElementsByClassName("ytp-menuitem");

    var MaxQualityDiv = undefined;
    var MaxQuality = 0;
    for (var i = 0; i < qualityDivs.length; i++) {
        if(qualityDivs[i].innerText.includes("1080") == true){
            MaxQualityDiv = qualityDivs[i];
            MaxQuality = 1080;
            break;
        }
        else if (qualityDivs[i].innerText.includes("720") == true) {
            if(MaxQuality<720){
                MaxQualityDiv = qualityDivs[i];
                MaxQuality = 720;
            }
        }
        else if (qualityDivs[i].innerText.includes("480") == true) {
            if (MaxQuality < 480) {
                    MaxQualityDiv = qualityDivs[i];
                    MaxQuality = 480;
            }
        } else if (qualityDivs[i].innerText.includes("Auto") == true){
            if(MaxQuality== 0){
                MaxQualityDiv = qualityDivs[i];
            }
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
        console.log(">>Iteration");
        if (lastDocument != document.location.href) {
            console.log("   >>New Page");
            lastDocument = document.location.href;
            var status = SetMaxQuality();
            if (status == 1) {
                console.log("       >>QualityChanged" + lastQuality.toString());
                if (lastQuality == 1080) {
                    console.log("           >>Reached Goal Quality")
                    break;
                }
            }
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log("Finished!")
}

(function () {
    'use strict';
    if (window.top != window.self) {
        return;
    }
    window.onload = function () {
        ListenToDocumentChanges();
    };
})();