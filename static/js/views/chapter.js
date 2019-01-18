var ChapterView = function() {
    var currentComic = null;
    var currentChapter = null;
    var imageLinks = null;
    var imageSrcs = null;
    var runHolder = false;
    var numLoaded = 0;

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

        if (!(chapter_num >= 0 && chapter_num < currentComic.num_chapters)) {
            console.error("Invalid chapter ", chapter_num);
            m.route.set("/comic/:comicid", {comicid: currentComic.id});
            return;
        }

        currentChapter = chapter_num;
        console.log("Current chapter is ", chapter_num)

        m.request({
            method: "GET",
            url: Utils.getChapterMetaURL(currentComic.id, currentChapter),
        }).then((result) => {
            imageLinks = result.image_links;
            imageSrcs = [];
            var width = parseInt(0.95 * window.innerWidth);
            var height = parseInt(0.95 * window.innerHeight);
            var prefix = "holder.js/" + width + "x" + height + "?theme=vine&text=placeholder-for-img-";
            for (var i=0; i < imageLinks.length; i++) {
                imageSrcs[i] = prefix + i;
            }

            m.redraw();

            for (var i=0; i < imageLinks.length; i++) {
                imageLinks[i] = Utils.getImageSrc(currentComic.id, currentChapter, imageLinks[i]);
                loadImage(i);
            }
        });
    }

    function loadImage(i) {
        Utils.loadImage(imageLinks[i], (result) => {
            imageSrcs[i] = result;
            m.redraw();
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

    function gotoNextChapter(e) {
        e.redraw = false;
        var nextChapter = currentChapter + 1;
        m.request({
            method: "POST",
            url: "/api/update_progress",
            data: {comic: currentComic.id, chapter: currentChapter}
        }).then((result) => {
            if (!result.success) {
                console.error("failed to update progress", result);
                return;
            }

            currentComic.last_read_chapter = currentChapter;
            m.route.set("/comic/:comicid/chapter/:chapternum/:key", {comicid: currentComic.id, chapternum: nextChapter, key: Date.now()});
            m.redraw();
        });
    }

    var ViewerComponent = {
        view: function() {
            var images = [];
            if (imageSrcs != null) {
                var holderCount = 0;
                for (var i=0; i < imageSrcs.length; i++) {
                    var src = imageSrcs[i];
                    var key = currentComic.id + "-" + currentChapter + "-img-" + i;
                    if (src.startsWith("holder.js")) {
                        key = "holder-" + key;
                        holderCount += 1;
                    }

                    images.push(m("img", {src: src, key: key}));
                }

                if (holderCount == 0) {
                    runHolder = false;
                } else {
                    runHolder = true;
                }
            }
            return m(".viewer", images);
        },

        oncreate: function() {
            if (runHolder) {
                Holder.run();
            }
        },
        onupdate: function() {
            if (runHolder) {
                Holder.run();
            }
        }
    }

    function GetMainComponent() {
        return {
            oninit: oninit,
            view: function() {
                if (currentComic == null) {
                    return;
                }

                if (currentChapter == null) {
                    return;
                }

                var onclick = gotoNextChapter;
                var btnText = "Next Chapter";

                if (currentChapter == (currentComic.num_chapters - 1)) {
                    btnText = "Last Chapter Reached";
                    onclick = () => {};
                }

                return m(".chapter-container", [
                    m(".header", currentComic.name + " : Chapter " + Utils.padChapterNum(currentChapter)),
                    m(ViewerComponent),
                    m("button", {id: "next-chapter", onclick: onclick}, btnText)
                ]);
            },
        }
    }
    return {GetMainComponent: GetMainComponent};
}();
