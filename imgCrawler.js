// ==UserScript==
// @name         image Crawler
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @include      *://*/*
// @grant        none
// ==/UserScript==


(function () {
    'use strict';
    window.onload = function () {
        var global_saved_pictures = [];
        var min_size_dest_w = 400;
        var min_size_dest_h = 400;
        var min_size_tag_w = 400;
        var min_size_tag_h = 400;

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
            for (var i = 0; i < imageList.length; i++) {
                var imgLink = imageList[i].getAttribute('src');
                if (global_saved_pictures.includes(imgLink)) {
                    continue;
                }
                var tag_height = imageList[i].height;
                var tag_width = imageList[i].width;
                if (tag_height < min_size_tag_h || tag_width < min_size_tag_w) {
                    continue;
                }
                //Create an image
                var img = new Image();

                //Set the src attribute to your URL
                img.src = imgLink;
                //When the image is loaded, read the available properties
                img.onload = function () {
                    //Get height and width
                    var actual_img_height = this.height;
                    var actual_img_width = this.width;
                    if (actual_img_height < min_size_dest_h || actual_img_width < min_size_dest_w) {
                        return;
                    }
                    this.width = "100";
                    this.height = "100";
                    this.setAttribute("tampermonkey", "1");
                    console.log(this.src);
                    //console.log(">>" + actual_img_width.toString() + "X" + actual_img_height.toString());
                    console.log(this);
                    var name = location.host + " - " + (Math.floor(Math.random() * 100000) + 1).toString();
                    document.head.appendChild(this);
                    global_saved_pictures.push(this.src);
                };

            }
        }
        function finish(){
            var e = document.body;
            e.parentNode.removeChild(e);
            var children = document.head.children;
            for (var i = 0; i < children.length; i++) {
                if(children[i].hasAttribute("tampermonkey") == false ){
                    document.head.removeChild(children[i]);
                }
            // Do stuff
            }
        }
        window.min_size_dest = min_size_dest;
        window.min_size_tag = min_size_tag;
        window.run = run;
        window.finish = finish;
        console.log("--Ready for commands--");
        console.log("min_size_tag(width, height) - min w and h for img tag on page");
        console.log("min_size_dest(width, height) - min w and h for real img at dest src=\"dest link...\"");
        console.log("run() - download images");
        console.log("finish() - and do \"save webpage as\"");
        setInterval(run, 300);
    };
})();




