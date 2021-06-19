// ==UserScript==
// @name         HLS video Getter
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  try to take over the world!
// @author       You
// @match        *://*.vk.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

var elementActions = {
    click: 1,
};
var elementType = {
    ID: 1,
    class: 2,
    tag: 3,
    innerText: 4,
};

//------------------------------------------------------------------------------------
//Explanations:
//
//------------------------------------------------------------------------------------
//1.1: host        -> check if current browser url matches window.location.hostname
//1.2: actionQueue[] -> list of actions to perform on page, each action is performed in order listed
//  1.2.1: elementFilterQueue[] -> Filter through the page, each successive pattern inherits from filtered item on consecutive indexes
//      1.2.1.1 pattern<regexPattern>  //regex pattern to find a specific type<elementType>
//      1.2.1.2 type<elementType>      //type of element to search for such as class, ID, tag etc...
//      1.2.1.3 async filterFunction(NodeList) => returns NodeList //Can be used alone, incase pattern + type is used then the filterFunction is called FIRST
//      1.2.1.4 tryFinal<bool> //optional, when specified true, if it finds any element then it ENDS filtering queue, if NO element is found, then filtering is continued from PREVIOUS filter results
//  1.2.2: action<elementActions> -> Perform this action on the found element
var LinkSearchPattern = [
    {
        host: /example\.com/i,
        actionQueue: [
            {
                elementFilterQueue: [ //Filter through the page, each successive pattern inherits from filtered item on previous index
                    { pattern: /navbarClass/i, type: elementType.class },
                    { pattern: /navbarBtnClass/i, type: elementType.class },
                    //function filters, param is array of previous filter, return filtered js node element array
                    {
                        filterFunction: async (NodeList) => {
                            return NodeList;
                        }
                    },
                    { pattern: /Go Home/i, type: elementType.innerText },
                ],
                action: elementActions.click, //Perform this action on the found element
            },
            {
                elementFilterQueue: [
                    { pattern: /body/i, type: elementType.tag },
                    { pattern: /loginBtnID/i, type: elementType.ID },
                ],
                action: elementActions.click
            },
            {
                elementFilterQueue: [
                    { pattern: /body/i, type: elementType.tag },
                    { pattern: /loginBtn_1/i, type: elementType.ID, tryFinal: true }, //ends if match, else continue from "body" pattern
                    { pattern: /loginBtn_2/i, type: elementType.ID, tryFinal: true }, //ends if match, else continue from "body" pattern
                    { pattern: /loginBtn_3/i, type: elementType.ID, tryFinal: true }, //ends if match, else continue from "body" pattern
                ],
                action: elementActions.click
            }
        ],
    },
    {
        host: /vk\.com/i,
        actionQueue: [
            {
                elementFilterQueue: [
                    { pattern: /videoplayer_btn_settings/i, type: elementType.class },
                ],
                action: elementActions.click,
            },
            {
                elementFilterQueue: [
                    { pattern: /videoplayer_settings_menu_list_item_quality/i, type: elementType.class },
                ],
                action: elementActions.click
            },
            {
                elementFilterQueue: [
                    { pattern: /videoplayer_settings_menu_sublist_item/i, type: elementType.class },
                    {
                        filterFunction: async (NodeList) => {
                            var MaxQualityDiv = undefined, tryCounter=0;
                            while (MaxQualityDiv == undefined && tryCounter < 10) {
                                var MaxQuality = 0;
                                for (var i = 0; i < NodeList.length; i++) {
                                    var quality = parseInt(NodeList[i].dataset.value)
                                    if (isNaN(quality) == false && quality > MaxQuality) {
                                        MaxQualityDiv = NodeList[i];
                                        MaxQuality = quality;
                                    }
                                }
                                if (MaxQualityDiv == undefined) {
                                    await new Promise(r => setTimeout(r, 1000));
                                }
                                tryCounter++;
                            }
                            return MaxQualityDiv ? [MaxQualityDiv] : [];
                        }
                    }
                ],
                action: elementActions.click
            },
        ],
    },
];
var activeHostPatterns = undefined;
var savedLinks = [];

function addXMLRequestCallback(callback) {
    var oldSend, i;
    if (XMLHttpRequest.callbacks) {
        var x = $("something appearance");
        XMLHttpRequest.callbacks.push(callback);
    } else {
        XMLHttpRequest.callbacks = [callback];
        oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
                XMLHttpRequest.callbacks[i](this);
            }
            oldSend.apply(this, arguments);
        };
    }
}

function is404(link) {
    var http = new XMLHttpRequest();
    http.open("HEAD", link, false);
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
            var matchedLink = link;
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
    "use strict";
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
    console.log("HLS VIDEO GETTER -> INJECT DONE\n" + "Functions: list(), clearList()\n" + "Variables: savedLinks\n");
    window.list = function () {
        console.log(savedLinks.join("\n"));
    };
    window.clearList = function () {
        savedLinks = [];
    };
    window.savedLinks = savedLinks;
    addXMLRequestCallback(function (xhr) {
        xhr.onload = function () {
            CheckLinkForMatch(xhr.responseURL);
        };
    });
})();
