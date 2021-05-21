// ==UserScript==
// @name         JS injector
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  try to take over the world!
// @author       You
// @run-at       document-start
// @match        *://*.k2s.cc/*
// @match        *://*.fboom.me/*
// @match        *://*.spacerival.com/*
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
	}, {
		host: /spacerival.com/is,
		scripts: [
			{
				srcNamePattern: /\/test.js/is,
				replacements: [
					{
						find: /^.*$/is,
						replaceWith: `
						    alert("yoyo")
                        `,
					},
				]
			},
		],
	},
];



var currentHostScripts = undefined;
var allObservedScripts = {};
var scriptCache = {};

var log = {
	DEBUG_MODE: true,
	id_lookup: { nextIndex: 1 },
	getID: function (hash) {
		if (hash in this.id_lookup) {
			return this.id_lookup[hash];
		}
		this.id_lookup[hash] = this.id_lookup.nextIndex;
		this.id_lookup.nextIndex++;
		return this.id_lookup[hash];

	},
	write: function (...params) {
		console.log("TM>", ...params);
	},
	debug: function (...params) {
		if (this.DEBUG_MODE) {
			console.log("TM>", ...params);
		}
	}
}


async function GetHTMLFromUrl(url) {
	var res = await fetch(url);
	var rawHTML = await res.text();
	return rawHTML;
}

function ProcessReplacementList(scriptData, replacementsList) {
	var modifiedScript = scriptData;

	for (const replacementPackage of replacementsList) {
		log.debug("Using replacementPackage -> ", replacementPackage)
		var matchedData = modifiedScript.match(replacementPackage.find);
		if (matchedData == undefined) {
			log.debug("No matches to apply from replacementpackage");
			continue;
		}
		log.write("Found matches to replace...", matchedData);
		modifiedScript = modifiedScript.replace(replacementPackage.find, replacementPackage.replaceWith);

	};
	log.debug("Modified script code -> ", modifiedScript);
	return modifiedScript;
}


function processTag(scriptTagString) {
	var parsedHTML = new DOMParser().parseFromString(scriptTagString, "text/html");
	var scriptTag = parsedHTML.head.firstChild;
	log.debug("New script tag appeared -> ", scriptTag, "hostscripts packages to be used -> ", currentHostScripts);
	//check if script is external src
	for (const scriptPackage of currentHostScripts) {
		if (scriptTag.src) { //src script
			log.debug("checking extern source pattern...");
			if (scriptPackage.srcNamePattern == undefined) {
				log.debug("no srcNamePattern regex, skipping...");
				continue
			}

			if (scriptTag.src.match(scriptPackage.srcNamePattern)) {
				//found current script
				log.debug("target script element found -> ", scriptTag);
				var currentScriptSrc = scriptTag.src;
				scriptTag.removeAttribute("src");

				var scriptData = scriptCache[currentScriptSrc];
				log.debug("External script fetched...", scriptData);
				var moddedScript = ProcessReplacementList(scriptData, scriptPackage.replacements);
				scriptTag.textContent = moddedScript;
			} else {
				log.debug("No source name pattern matches found for this script element")
			}
		} else { //inline script
			log.debug("checking inline pattern...");
			if (scriptPackage.inlinePattern == undefined) {
				log.debug("no inline regex pattern skipping...");
				continue;
			}

			if (scriptTag.text || scriptTag.text.match(scriptPackage.inlinePattern)) {
				//found current script
				log.debug("target script element found -> ", scriptTag);
				var scriptData = scriptTag.text;
				scriptTag.text = "";

				var moddedScript = ProcessReplacementList(scriptData, scriptPackage.replacements);
				scriptTag.textContent = moddedScript;
			} else {
				log.debug("No source name pattern matches found for this script element")
			}
		}
	};
	log.debug("----End of SCRIPT DOM ELEMENT----\n\n\n");
	return scriptTag.outerHTML;
}

async function fillScriptCache(scriptTagList) {
	for (const scriptTagString of scriptTagList) {
		var parsedHTML = new DOMParser().parseFromString(scriptTagString, "text/html");
		var scriptTag = parsedHTML.head.firstChild;

		for (const scriptPackage of currentHostScripts) {
			if (scriptTag.src) { //src script
				if (scriptPackage.srcNamePattern == undefined) {
					continue
				}

				if (scriptTag.src.match(scriptPackage.srcNamePattern)) {
					var scriptData = await GetHTMLFromUrl(scriptTag.src);
					scriptCache[scriptTag.src] = scriptData;
					log.debug("External script fetched...", scriptData);
				} else {
					log.debug("No source name pattern matches found for this script element")
				}
			} else { //inline script
			}
		};
	}

}

function checkIfHostInPatterns() {
	for (var i = 0; i < LinkSearchPattern.length; i++) {
		var hostPattern = LinkSearchPattern[i].host;
		if (window.location.hostname.match(hostPattern) != undefined) {
			currentHostScripts = LinkSearchPattern[i].scripts;
			return true;
		}
	}
	log.write(undefined, "No matched host pattern...");
	return false;

}

(function () {
	'use strict';
	if (checkIfHostInPatterns() == false) {
		return;
	}
	log.write(undefined, "JS source modifier -> INJECT DONE\n" +
		"Functions: \n" +
		"Variables: \n");

	window.stop(); //kill page execution

	const xhr = new XMLHttpRequest();
	xhr.open('GET', window.location.href);
	xhr.onload = async () => {
		debugger;
		var findScriptTagRegex = /<script.*?>.*?<\/script>/gis;
		await fillScriptCache([...xhr.responseText.match(findScriptTagRegex)]);
		var html = xhr.responseText.replace(/<script.*?>.*?<\/script>/gis, scriptTagString => {
			return processTag(scriptTagString);
		});
		document.open();
		document.write(html);
		document.close();
	};
	xhr.send();
})();