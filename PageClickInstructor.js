// ==UserScript==
// @name         Page click instructor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        *://*.vk.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

var ElementActionEnum = {
    click: 1,
};
var ElementTypeEnum = {
    ID: 1,
    class: 2,
    tag: 3,
    innerText: 4, //also allows regex expressions, otherwise apply simple string.contains()
    querySelectorAll: 5,
};

//------------------------------------------------------------------------------------
//Explanations:
//
//------------------------------------------------------------------------------------
//1.1: host             -> check if current browser url matches window.location.hostname
//1.2: retryCount<int>  -> optional, incase ANY of the actionQueue results in no elements being found then retry every 1 second (retryCount==-1 means try inifinite amount)
//1.3: actionQueue[]    -> list of actions to perform on page, each action is performed in order listed
//  1.3.1: elementFilterQueue[] -> Filter through the page, each successive pattern inherits from filtered item on consecutive indexes
//      1.3.1.1 pattern<regexPattern>  //regex pattern to find a specific type<elementType>
//      1.3.1.2 type<elementType>      //type of element to search for such as class, ID, tag etc...
//      1.3.1.3 async filterFunction(NodeList) => returns NodeList //Can be used alone, incase pattern + type is used then the filterFunction is called FIRST
//      1.3.1.4 tryFinal<bool> //optional, when specified true, if it finds any element then it ENDS filtering queue, if NO element is found, then filtering is continued from PREVIOUS filter results
//      1.3.1.4 delayMS<int> //optional, Specify a delay in milliseconds before a filter in the queue will run
//  1.3.2: action<elementActions> -> Perform this action on the found element
var LinkSearchPattern = [
    {
        host: /example\.com/i,
        RetryCount: 0, // retry 0 times ever 1 second incase any of the actionQueue can't find element
        actionQueue: [
            {
                elementFilterQueue: [ //Filter through the page, each successive pattern inherits from filtered item on previous index
                    { find: "navbarClass", type: ElementTypeEnum.class },
                    { find: "navbarBtnClass", type: ElementTypeEnum.class },
                    //function filters, param is array of previous filter, return filtered js node element array
                    {
                        filterFunction: async (NodeList) => {
                            return NodeList;
                        }
                    },
                    { find: "Go Home", type: ElementTypeEnum.innerText },
                ],
                action: ElementActionEnum.click, //Perform this action on the found element
            },
            {
                elementFilterQueue: [
                    { find: "body", type: ElementTypeEnum.tag },
                    { find: "loginBtnID", type: ElementTypeEnum.ID, delayMS: 200 }, //200 ms waiting before this filter is processed
                ],
                action: ElementActionEnum.click
            },
            {
                elementFilterQueue: [
                    { find: "body", type: ElementTypeEnum.tag },
                    { find: "loginBtn_1", type: ElementTypeEnum.ID, tryFinal: true }, //ends if match, else continue from "body" pattern aka first pattern that did not have tryFinal
                    { find: "loginBtn_2", type: ElementTypeEnum.ID, tryFinal: true }, //ends if match, else continue from "body" pattern
                    { find: "loginBtn_3", type: ElementTypeEnum.ID, tryFinal: true }, //ends if match, else continue from "body" pattern
                ],
                action: ElementActionEnum.click
            }
        ],
    },
    {
        host: /vk\.com/i,
        RetryCount: 7,
        actionQueue: [
            {
                elementFilterQueue: [
                    { find: "videoplayer_btn_settings", type: ElementTypeEnum.class },
                ],
                action: ElementActionEnum.click,
            },
            {
                elementFilterQueue: [
                    { find: "videoplayer_settings_menu_list_item_quality", type: ElementTypeEnum.class },
                ],
                action: ElementActionEnum.click
            },
            {
                elementFilterQueue: [
                    { find: "videoplayer_settings_menu_sublist_item", type: ElementTypeEnum.class },
                    {
                        filterFunction: async (NodeList) => {
                            var MaxQualityDiv = undefined;
                            var MaxQuality = 0;
                            for (var i = 0; i < NodeList.length; i++) {
                                var quality = parseInt(NodeList[i].dataset.value)
                                if (isNaN(quality) == false && quality > MaxQuality) {
                                    MaxQualityDiv = NodeList[i];
                                    MaxQuality = quality;
                                }
                            }
                            return MaxQualityDiv ? [MaxQualityDiv] : [];
                        }
                    }
                ],
                action: ElementActionEnum.click
            },
        ],
    },
];

var app_tm = {
    activeHostPackage: undefined,
    currentSearchArray: undefined,
    on_actionNotFound_waitTime= 1000, //milli seconds
    DEBUG_MODE: false,
    log: function (...params) {
        console.log("TM>", ...params);
    },
    debug: function (...params) {
        if (this.DEBUG_MODE) {
            this.write(...params)
        }
    },
    sleep: async function (ms) {
        await new Promise(r => setTimeout(r, ms));
    }
}

function GetElementListByType(findString, elementType, currentSearchArray) {
    var matchingObjects = [];
    switch (elementType) {
        case ElementTypeEnum.ID:
            var foundObject = document.getElementById(findString)
            if (foundObject != null) {
                matchingObjects.push(foundObject);
            }
            break;
        case ElementTypeEnum.class:
            for (searchLocation in currentSearchArray) {
                var foundObjects = currentSearchLocation.getElementsByClassName(findString);
                for (var i = 0; i < foundObjects.length; i++) {
                    matchingObjects.push(foundObjects[i]);
                }
            }
            break;
        case ElementTypeEnum.innerText:
            findStringIsRegex = findString instanceof RegExp;
            for (searchLocation in currentSearchArray) {
                if (findStringIsRegex) { //is regex /regexcode/i
                    if (searchLocation.textContent.match(findString)) {
                        matchingObjects.push(searchLocation);
                    }
                } else { //is string, check if contains "example"
                    if (searchLocation.textContent.contains(findString)) {
                        matchingObjects.push(searchLocation);
                    }
                }
            }
            break;
        case ElementTypeEnum.tag:
            var foundObjects = currentSearchLocation.get(findString);
            for (var i = 0; i < foundObjects.length; i++) {
                matchingObjects.push(foundObjects[i]);
            }
            break;
        case ElementTypeEnum.querySelectorAll:
            var foundObjects = currentSearchLocation.querySelectorAll(findString);
            for (var i = 0; i < foundObjects.length; i++) {
                matchingObjects.push(foundObjects[i]);
            }
            break;
        default:
            throw "elementType is not of ElementTypeEnum!";
    }
    return foundObjects;
}

async function PerformElementFilter(elementFilterPackage, currentSearchArray) {
    filteredSearchArray = currentSearchArray;
    app_tm.debug("Before performing element filter = ", filteredSearchArray);

    if (elementFilterPackage.delayMS != undefined) {
        app_tm.debug("sleeping for " + delayMS + "MS before running elementFilterPackage:", elementFilterPackage);
        await app_tm.sleep(delayMS);
    }
    if (elementFilterPackage.filterFunction != undefined) {
        app_tm.debug("Running Filter function");
        filteredSearchArray = await elementFilterPackage.filterFunction(filteredSearchArray);
        app_tm.debug("after filter function = ", filteredSearchArray);
    }
    if (elementFilterPackage.find || elementFilterPackage.type) {
        if (elementFilterPackage.find && elementFilterPackageList.type) {
            filteredSearchArray = GetElementListByType(elementFilterPackage.find, elementFilterPackage.type, filteredSearchArray);

            app_tm.debug("after find element by string = ", filteredSearchArray);
        } else {
            console.error("you cannot only specify one of keys 'type' or 'find' since they work together, specify both.");
        }
    }
    app_tm.debug("Fully filtered single elementFilter -> ", filteredSearchArray);
    return filteredSearchArray;
}

async function ProcessElementFilterQueue(elementFilterPackageList) {
    var currentSearchArray = [document];
    for (elementFilter in elementFilterPackageList) {
        currentSearchArray = await PerformElementFilter(elementFilter, currentSearchArray);
    }
    if (currentSearchArray.length == 0) {
        return undefined;
    } else if (currentSearchArray.length > 1) {
        app_tm.debug("filtered search result is more than one element, action will be performed on first index -> ", currentSearchArray)
    }
    return currentSearchArray[0];
}

async function PerformAction(actionPackage) {
    var result = await ProcessElementFilterQueue(actionPackage.elementFilterQueue);
    if (result == undefined) { //no element found to apply action
        app_tm.debug("No element to perform action on found for ", actionPackage);
        return false;
    }

    if (actionPackage.action != undefined) { //action exists
        switch (actionPackage.action) {
            case ElementActionEnum.click:
                app_tm.log("Clicked on ", result);
                result.click();
                break;
            default:
                throw "Type must be of ElementActionEnum!";
        }
    } else { //element found but no action specified
        app_tm.log("Element was found but no action specified to perform on -> ", result);
    }
    return true;

}

async function ProcessActionQueue(actionPackageList) {
    var actionsDidNotFindTarget = false;
    for (actionPackage in actionPackageList) {
        var foundTarget = await PerformAction(actionPackage);
        if (!foundTarget) {
            actionsDidNotFindTarget = true;
        }
    }
    if(actionsDidNotFindTarget){
        return false; //fail, send for retry if requested
    }
    return true;



}
async function init() {
    var retryCount = 0;
    while(true){
        var success = ProcessActionQueue(app_tm.activeHostPackage.actionQueue);
        if(success){
            break;
        }
        retryCount++;
        if(app_tm.activeHostPackage.RetryCount == undefined || retryCount > app_tm.activeHostPackage.RetryCount){
            break;
        }else{
            app_tm.log("One of the actions did not find target, retrying action queue... retry count " + retryCount);
            await app_tm.sleep(app_tm.on_actionNotFound_waitTime);
        }
    }
}

function checkIfHostInPatterns() {

    for (var i = 0; i < LinkSearchPattern.length; i++) {
        var hostPattern = LinkSearchPattern[i].host;
        if (window.location.hostname.match(hostPattern) != undefined) {
            app_tm.activeHostPackage = LinkSearchPattern[i];
            return true;
        }
    }
    log.write(undefined, "No matched host pattern...");
    return false;

}

(function () {
    "use strict";
    if (window.top != window.self) {
        return;
    }
    if (checkIfHostInPatterns() == false) {
        return;
    }
    log.write(undefined, "PageClickInstructor -> INJECT DONE\n" +
        "Functions: \n" +
        "Variables: \n");
    init();
})();
