var padNum = function(num, padding) {
    var numstr = "000000000000" + num.toFixed(0);
    return numstr.substring(numstr.length - padding, numstr.length);
};

var padChapterNum = function(num) {
    return padNum(num, 4);
};

var getChapterMetaURL = function(comic, chapter) {
    var chapterstr = padChapterNum(chapter);
    return "/comicfs/" + comic + "/" + chapterstr + ".cbz/meta.json";
};

function testWebP(callback) {
        var webP = new Image();
        webP.onload = webP.onerror = function () {
                    callback(webP.height == 2);
                };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
};

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

var WebPSupport = true;
testWebP(function(support) {
    if (!support) {
        console.warn("no webp support...")
        WebPSupport = false;
    }
});

var getImageSrc = function(comic, chapter, img) {
    var chapterstr = padChapterNum(chapter);
    if (img.endsWith(".webp") && !WebPSupport) {
        img = img + ".png"
    }
    return "/comicfs/" + comic + "/" + chapterstr + ".cbz/" + img;
};
