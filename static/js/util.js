var Utils = function() {
    var Options = {
        WebPSupport: true,
        DecodeWebPAtServer: true,
    }

    function init() {
        m.route.setOrig = m.route.set;
        m.route.set = function(path, data, options){
            m.route.setOrig(path, data, options);
            window.scrollTo(0,0);
        }

        m.route.linkOrig = m.route.link;
        m.route.link = function(vnode){
            m.route.linkOrig(vnode);
            window.scrollTo(0,0);
        }

        testWebP(function(support) {
            if (!support) {
                console.warn("no webp support...")
                Options.WebPSupport = false;
            } else {
                Options.WebPSupport = true;
            }
        });

        m.request({method: "GET", url: "/api/options"})
         .then( (response) => {
             console.info("got options", response);
             if (response.success) {
                 if (response.result.decode_image_at_server != undefined) {
                     Options.DecodeWebPAtServer = response.result.decode_image_at_server;
                     return
                 }
             }

             console.error("failed to set options", result);
         });
    }

    function testWebP(callback) {
        var webP = new Image();
        webP.onload = webP.onerror = function () {
                    callback(webP.height == 2);
                };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };

    function padNum(num, padding) {
        var numstr = "000000000000" + num.toFixed(0);
        return numstr.substring(numstr.length - padding, numstr.length);
    };

    function padChapterNum(num) {
        return padNum(num, 4);
    };

    function getChapterMetaURL(comic, chapter) {
        var chapterstr = padChapterNum(chapter);
        return "/comicfs/" + comic + "/" + chapterstr + ".cbz/meta.json";
    };

    function getImageSrc(comic, chapter, img) {
        var chapterstr = padChapterNum(chapter);
        if (img.endsWith(".webp") && !Utils.Options.WebPSupport && Utils.Options.DecodeWebPAtServer) {
                img = img + ".png"
        }
        return "/comicfs/" + comic + "/" + chapterstr + ".cbz/" + img;
    };

    function loadImage(img, cb) {
        if (img.endsWith(".webp") && !Utils.Options.WebPSupport) {
            loadWebPImageAsPNG(img, cb)
            return
        }
        
        var myimg = new Image();
        myimg.onload = () => {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = myimg.naturalHeight;
            canvas.width = myimg.naturalWidth;
            ctx.drawImage(myimg, 0, 0);
            dataURL = canvas.toDataURL();
            cb(dataURL);
        }

        myimg.src = img;
    }

    function loadWebPImageAsPNG(img, cb) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', img, true);
		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
		  if (this.status == 200) {
			var uInt8Array = new Uint8Array(this.response);
			var i = uInt8Array.length;
			var binaryString = new Array(i);
			while (i--)
			{
			    binaryString[i] = String.fromCharCode(uInt8Array[i]);
			}
			var data = binaryString.join('');
            var dataUrl = _ComicUIWebP.ConvertToPNG(data);
            cb(dataUrl)
			return
		  }
		};

		xhr.send();
/*
        m.request({method:"GET", url: img, deserialize: (v) => { return v; }})
        .then( (data) => {
            console.log("Got data", data);
            var uInt8Array = new Uint8Array(data);
            var i = uInt8Array.length;
            var binaryString = new Array(i);
            while (i--) {
                binaryString[i] = String.fromCharCode(uInt8Array[i]);
            }

            var binaryData = binaryString.join('');
            var dataUrl = _ComicUIWebP.ConvertToPNG(binaryData);
            return cb(dataUrl)
        });
*/
    }

    return {
        init: init,
        Options: Options,
        padChapterNum: padChapterNum,
        getImageSrc: getImageSrc,
        getChapterMetaURL: getChapterMetaURL,
        loadImage: loadImage,
    };
}();

Utils.init();
