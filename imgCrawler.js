// ==UserScript==
// @name         image Crawler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      *://*/*
// @grant        none
// ==/UserScript==
min_size_dest_w = 400;
min_size_dest_h = 400;
min_size_tag_w = 400;
min_size_tag_h = 400;

function min_size_dest($width, $height) {
    min_size_dest_w = $width;
    min_size_dest_h = $height;
}

function min_size_tag($width, $height) {
    min_size_tag_w = $width;
    min_size_tag_h = $height;
}

function run() {
    var imageList = document.getElementsByTagName("img");
    for (var globalIndex = 0; globalIndex < imageList.length; globalIndex++) {
        setTimeout(function (i) {
            var imgLink = imageList[i].getAttribute('src');
            var tag_height = imageList[i].height;
            var tag_width = imageList[i].width;
            if (tag_height < min_size_tag_h || tag_width < min_size_tag_w) {
                return;
            }
            //Create an image
            var img = new Image();
            //Set the src attribute to your URL
            img.src = imgLink;
            //When the image is loaded, read the available properties
            img.onload = function () {
                //Get height and width
                var actual_img_height = img.height;
                var actual_img_width = img.width;
                if (actual_img_height < min_size_dest_h || actual_img_width < min_size_dest_w) {
                    return;
                }
                console.log(img.src);
                console.log(">>" + actual_img_width.toString() + "X" + actual_img_height.toString());
                name = location.host + " - " +(Math.floor(Math.random() * 100000) + 1).toString();
                Math.random();  
                var arg = {
                    url: img.src,
                    name: name + ".jpg"
                };
                GM_download(arg);
            };
        }, globalIndex * 50, globalIndex);
    }
}
(function () {
    'use strict';
    window.onload = function () {
        console.log("--Ready for commands--");
        console.log("min_size_tag(width, height) - min w and h for img tag on page");
        console.log("min_size_dest(width, height) - min w and h for real img at dest src=\"dest link...\"");
        console.log("run() - download images");
    };
})();




