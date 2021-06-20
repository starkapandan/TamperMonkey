// ==UserScript==
// @name         JS injector
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  try to take over the world!
// @author       You
// @run-at       document-start
// @match        *://*.k2s.cc/*
// @match        *://*.fboom.me/*
// @grant        none
// ==/UserScript==




var LinkSearchPattern = [
	{
		host: /example.com/is, //searches in window.location.hostname
		scripts: [
			{
				srcNamePattern: /files\/js\/example.js/is, //check if this script from a source is called
				replacements: [
					{
						find: /hello world/is,  //find regex match in external script
						replaceWith: "alert('hello world')", //replace with string capture groups can be refered with $index starting from 1
					},
				]
			},
			{
				inlinePattern: /var init = 5;/is, //check for an inline script that contains this pattern
				replacements: [
					{
						find: /hello world/is,  //find regex match in external script
						replaceWith: "alert('hello world')", //replace with string
					},
				]
			},
		]
	}, {
		host: /(k2s\.cc|fboom\.me)/is,
		scripts: [
			{
				srcNamePattern: /\/static\/js\/spa\/.*/is,
				replacements: [
					{
						find: /(var t=e\.isDeleted)/is,
						replaceWith: `
						//patch
						if(window.TM_INJECT == undefined){
							try {
								var videolink = e.videoPreview.video;
								if (videolink != undefined && videolink != "") {
									window.TM_INJECT = true;
									var div = document.createElement("div");
									div.href = videolink;
									var totalMB = "?";
									try{
										var totalBytes = videolink.match(/(?<=response_limit=).*?(?=&|$)/is)[0];
										totalMB = parseInt(parseInt(totalBytes) /1000/1000);
									}catch(e){}
									div.innerHTML = "<button><a href='" + videolink + "'><h1>Patch -> GO TO VIDEO (" + totalMB +"MB)</h1></a></button>";
									document.body.insertBefore(div, document.body.firstChild);
								}
							}catch(e){console.log("err: could not parse response limit")}
							console.log("the special object -> ", e);
						}$1`,
					},
					{
						find: /^/is,
						replaceWith: `var div = document.createElement("div");
						div.innerHTML = "<p>Modified script...</p>"
						document.body.insertBefore(div, document.body.firstChild);`,
					}
				]
			},
		],
	},
];

var app_tm = {
	currentHostScripts = undefined,
	DEBUG_MODE: false,
	id_lookup: { nextIndex: 1 },
	getID: function (hash) {
		if (hash in this.id_lookup) {
			return this.id_lookup[hash];
		}
		this.id_lookup[hash] = this.id_lookup.nextIndex;
		this.id_lookup.nextIndex++;
		return this.id_lookup[hash];

	},
	log: function (id, ...params) {
		if (id == undefined) {
			console.log("TM>", ...params);
		} else {
			console.log("TM#" + this.getID(id) + ">", ...params);
		}
	},
	debug: function (id, ...params) {
		if (this.DEBUG_MODE) {
			if (id == undefined) {
				console.log("TM>", ...params);
			} else {
				console.log("TM#" + this.getID(id) + ">", ...params);
			}
		}
	},
	sleep: async function (ms) {
        await new Promise(r => setTimeout(r, ms));
    }
}


async function GetHTMLFromUrl(url) {
	var res = await fetch(url);
	var rawHTML = await res.text();
	return rawHTML;
}

function ProcessReplacementList(scriptData, replacementsList, newNodeHashID) {
	var modifiedScript = scriptData;

	for (const replacementPackage of replacementsList) {
		app_tm.debug(newNodeHashID, "Using replacementPackage -> ", replacementPackage)
		var matchedData = modifiedScript.match(replacementPackage.find);
		if (matchedData == undefined) {
			app_tm.debug(newNodeHashID, "No matches to apply from replacementpackage");
			continue;
		}
		app_tm.log(newNodeHashID, "Found matches to replace...", matchedData);
		modifiedScript = modifiedScript.replace(replacementPackage.find, replacementPackage.replaceWith);

	};
	eval(modifiedScript);
	app_tm.debug(newNodeHashID, "Modified script code -> ", modifiedScript);
}

function init() {
	new MutationObserver((mutations, observer) => {
		// Find whether the script tag you want to tamper with exists
		// If you can't predictably identify its location,
		// you may have to iterate through the mutations' addedNodes
		const tamperTarget = document.querySelectorAll('script');
		if (tamperTarget.length == 0) {
			return;
		}
		for (var i = 0; i < tamperTarget.length; i++) {
			//check if already scanned
			if (tamperTarget[i].tm_scanned != undefined) {
				app_tm.debug("Already scanned skipping...");
				continue;
			}
			var newNodeHashID = window.performance.now().toString();
			tamperTarget[i].tm_scanned = newNodeHashID;
			app_tm.debug(newNodeHashID, "New script element appeared -> ", tamperTarget[i].src, "hostscripts packages to be used -> ", app_tm.currentHostScripts);
			//check if script is external src
			for (const scriptPackage of app_tm.currentHostScripts) {
				if (tamperTarget[i].src) { //src script
					app_tm.debug(newNodeHashID, "checking extern source pattern...");
					let currentTamperTarget = tamperTarget[i];
					if (scriptPackage.srcNamePattern == undefined) {
						app_tm.debug(newNodeHashID, "no srcNamePattern regex, skipping...");
						continue
					}

					if (currentTamperTarget.src.match(scriptPackage.srcNamePattern)) {
						//found current script
						app_tm.debug(newNodeHashID, "target script element found -> ", currentTamperTarget);
						var currentScriptSrc = currentTamperTarget.src;
						currentTamperTarget.removeAttribute("src");

						GetHTMLFromUrl(currentScriptSrc).then(scriptData => {
							app_tm.debug(newNodeHashID, "External script fetched...", scriptData);
							ProcessReplacementList(scriptData, scriptPackage.replacements, newNodeHashID);
						});
					} else {
						app_tm.debug(newNodeHashID, "No source name pattern matches found for this script element")
					}
				} else { //inline script
					app_tm.debug(newNodeHashID, "checking inline pattern...");
					let currentTamperTarget = tamperTarget[i];
					if (scriptPackage.inlinePattern == undefined) {
						app_tm.debug(newNodeHashID, "no inline regex pattern skipping...");
						continue;
					}

					if (currentTamperTarget.text || currentTamperTarget.text.match(scriptPackage.inlinePattern)) {
						//found current script
						app_tm.debug(newNodeHashID, "target script element foun -> ", currentTamperTarget);
						var scriptData = currentTamperTarget.text;
						currentTamperTarget.text = "";

						ProcessReplacementList(scriptData, scriptPackage.replacements, newNodeHashID);
					} else {
						app_tm.debug(newNodeHashID, "No source name pattern matches found for this script element")
					}
				}
			};
			app_tm.debug(newNodeHashID, "----End of SCRIPT DOM ELEMENT----\n\n\n");
		}

	}).observe(document.documentElement, { childList: true, subtree:true });
}

function checkIfHostInPatterns() {

	for (var i = 0; i < LinkSearchPattern.length; i++) {
		var hostPattern = LinkSearchPattern[i].host;
		if (window.location.hostname.match(hostPattern) != undefined) {
			app_tm.currentHostScripts = LinkSearchPattern[i].scripts;
			return true;
		}
	}
	app_tm.log(undefined, "No matched host pattern...");
	return false;

}

(function () {
	'use strict';
	if (checkIfHostInPatterns() == false) {
		return;
	}
	window.app_tm = app_tm;
	app_tm.log(undefined, "JS source modifier -> INJECT DONE\n" +
		"Functions: \n" +
		"Variables: \n");
	init();
})();