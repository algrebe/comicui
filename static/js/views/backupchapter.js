var ChapterView = function() {
    var currentComic = null;
    var currentChapter = null;
    var numImages = -1;
    var currentImgIdx = 0;

    function onSwipeLeft() {
        console.log("left swipe");
        if (currentImgIdx <= 0) {
            console.log("Need to transition to previous chapter");
            return;
        }

        currentImgIdx = currentImgIdx - 1;
        m.redraw();
    }

    function onSwipeRight() {
        console.log("right swipe");
        if (numImages > 0 && currentImgIdx >= numImages) {
            console.log("Need to transition to next chapter");
            return;
        }

        currentImgIdx = currentImgIdx + 1;
        console.log("redrawing");
        m.redraw();
    }

    function initChapter() {
        var comicid = m.route.param("comicid");
        var chapter_num = parseInt(m.route.param("chapternum"));
        console.log("Initializing chapter " + chapter_num + " for comic " + comicid);

        currentComic = ComicList.dict[comicid];
        if (!currentComic) {
            console.error("No such comic ", comicid);
            m.route.set("/");
            return
        }

        if (!(chapter_num > 0 && chapter_num < currentComic.num_chapters)) {
            console.error("Invalid chapter ", chapter_num);
            m.route.set("/comic/:comicid", {comicid: currentComic.id});
            return;
        }

        currentChapter = chapter_num;

        m.request({
            method: "GET",
            url: getChapterMetaURL(currentComic.id, currentChapter),
        }).then((result) => {
            numImages = result.image_links.length;
            var body = document.body;
            var mc = new Hammer.Manager(body, { 
                recognizers: [
                    [Hammer.Swipe, {direction: Hammer.DIRECTION_HORIZONTAL }]
                ]
            });

            mc.on("swipeleft", onSwipeLeft);
            mc.on("swiperight", onSwipeRight);
        });
    }

    function oninit() {
        if (ComicList.initialized) {
            initChapter();
            return;
        }
        else {
            ComicList.initComics().then(initChapter);
        }
    }

    var ViewerComponent = {
        view: function() {
            return m(".viewer", [
                m("img", {src:getImageSrc(currentComic.id, currentChapter, currentImgIdx)})
            ]);
        }
    }

    function GetMainComponent() {
        return {
            oninit: oninit,
            view: function() {
                if (!currentComic) {
                    return;
                }

                if (!currentChapter) {
                    return;
                }

                return m(".chapter-container", [
                    m(".header", currentComic.name + " : Chapter " + padChapterNum(currentChapter)),
                    m(ViewerComponent)
                ]);
            }
        }
    }
    return {GetMainComponent: GetMainComponent};
}();
