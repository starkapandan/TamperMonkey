// ==UserScript==
// @name         JS injector
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  try to take over the world!
// @author       You
// @run-at      document-start
// @match        *://k2s.cc/*
// @match        *://fboom.me/*
// @grant        none
// ==/UserScript==

var DEBUG_MODE = false;
var log = {
	write: (...params) => {
		console.log("TM>", ...params);
	},
	debug: (...params) => {
		if (DEBUG_MODE) {
			console.log("TM>", ...params);
		}
	}
}

var k2s_type_replacementbody = `
//patch
if(window.TM_INJECT == undefined){
	try {
		var videolink = e.file.videoPreview.video;
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
}`;

var LinkSearchPattern = [
	{
		host: /example.com/is, //searches in window.location.hostname
		scripts: [
			{
				srcNamePattern: /files\/js\/example.js/is, //check if this script from a source is called
				replacements: [
					{
						find: /hello world/is,  //find regex match in external script
						replaceWith: "alert('hello world')", //replace with string
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
	},{
		host: /(k2s\.cc|fboom\.me)/is,
		scripts: [
			{
				srcNamePattern: /\/static\/js\/spa\/.*/is,
				replacements: [
					{
						find: /var t=e\.isDeleted/is,
						replaceWith: k2s_type_replacementbody + "var t=e.isDeleted",
					}
				]
			},
		],
	},
];

var currentHostScripts = undefined;
var allObservedScripts = {};

async function GetHTMLFromUrl(url) {
	var res = await fetch(url);
	var rawHTML = await res.text();
	return rawHTML;
}

function ProcessReplacementList(scriptData, replacementsList) {
	for (const replacementPackage of replacementsList) {
		log.debug("Using replacementPackage -> ", replacementPackage)
		var matchedData = scriptData.match(replacementPackage.find);
		if (matchedData == undefined) {
			log.debug("No matches to apply from replacementpackage");
			continue;
		}
		log.write("Found matches to replace...", matchedData);
		var modifiedScript = scriptData.replace(replacementPackage.find, replacementPackage.replaceWith);
		eval(modifiedScript);
		log.debug("Modified script code -> ", modifiedScript);
	};
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
				log.debug("Already scanned skipping...");
				continue;
			}
			log.debug("New script element appeared -> ", tamperTarget[i].src);
			log.debug("hostscripts packages to be used -> ", currentHostScripts);
			//check if script is external src
			for (const scriptPackage of currentHostScripts) {
				if (tamperTarget[i].src) { //src script
					log.debug("checking extern source pattern...");
					let currentTamperTarget = tamperTarget[i];
					if (scriptPackage.srcNamePattern == undefined) {
						log.debug("no srcNamePattern regex, skipping...");
						continue
					}

					if (currentTamperTarget.src.match(scriptPackage.srcNamePattern)) {
						//found current script
						var currentScriptSrc = currentTamperTarget.src;
						currentTamperTarget.removeAttribute("src");

						log.debug("target script element found -> ", currentTamperTarget);
						GetHTMLFromUrl(currentScriptSrc).then(scriptData => {
							log.debug("External script fetched...", scriptData);
							ProcessReplacementList(scriptData, scriptPackage.replacements);
						})
					} else {
						log.debug("No source name pattern matches found for this script element")
					}
				} else { //inline script
					log.debug("checking inline pattern...");
					let currentTamperTarget = tamperTarget[i];
					if (scriptPackage.inlinePattern == undefined) {
						log.debug("no inline regex pattern skipping...");
						continue;
					}

					if (currentTamperTarget.text.match(scriptPackage.inlinePattern)) {
						//found current script
						log.debug("target script element foun -> ", currentTamperTarget);
						var scriptData = currentTamperTarget.text;
						currentTamperTarget.text = "";

						ProcessReplacementList(scriptData, scriptPackage.replacements);
					} else {
						log.debug("No source name pattern matches found for this script element")
					}
				}



			};

			tamperTarget[i].tm_scanned = "true";
			log.debug("----End of SCRIPT DOM ELEMENT----\n\n\n");
		}

	})
		.observe(document.body, { childList: true });
}

function checkIfHostInPatterns() {

	for (var i = 0; i < LinkSearchPattern.length; i++) {
		var hostPattern = LinkSearchPattern[i].host;
		if (window.location.hostname.match(hostPattern) != undefined) {
			currentHostScripts = LinkSearchPattern[i].scripts;
			return true;
		}
	}
	log.write("No matched host pattern...");
	return false;

}

(function () {
	'use strict';
	if (window.top != window.self) {
		return;
	}
	if (checkIfHostInPatterns() == false) {
		return;
	}
	log.write("JS source modifier -> INJECT DONE\n" +
		"Functions: \n" +
		"Variables: \n");
	init();
})();