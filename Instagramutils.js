// ==UserScript==
// @name         Instagram utils
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*.instagram.com/*
// @grant        none
// ==/UserScript==
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
(function() {
    'use strict';
    if (window.top != window.self) {
        return;
    }
    console.log("Instagram Bookmark check-> INJECT DONE\n" +
        "Functions: FindLastBookmark()\n" +
        "Variables: \n");


    window.FindLastBookmark = async function(){
        var bookmarkFound = false;
        document.onscroll = () => {
            if (document.body.innerHTML.includes("Ta bort")){
                bookmarkFound = true;
                alert("Bookmark found!");
                document.onscroll = undefined;
            }
        }
        while(bookmarkFound == false){
            window.scrollTo(0,document.body.scrollHeight);
            await sleep(300);
        }

    }
})();