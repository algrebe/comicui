var ChapterListView = function() {

    var currentComic = null;

    function getID(chapterNum) {
        return "comic-" + currentComic.id + "-chapter-" + padChapterNum(chapterNum);
    }

    function BuildChapterComponent(chapterNum) {
        function onChapterClicked(e) {
            e.redraw = false;
            console.info("you clicked chapter", chapterNum);
            m.route.set("/comic/:comicid/chapter/:chapternum/:key", {comicid: currentComic.id, chapternum: chapterNum, key: Date.now()});
        }

        return {
            view: function() {
                return m(".chapter-list-item", 
                    {id: getID(chapterNum), onclick: onChapterClicked}, 
                    [m(".chapter-title", "Chapter " + padChapterNum(chapterNum))]
                )
            }
        }
    }

    function ChapterListComponent() {
        var currentChapter = currentComic.last_read_chapter;

        return {
            view: function() {
                var chapters = [];
                for(var i=0; i < currentComic.num_chapters; i++) {
                    chapters.push(m(BuildChapterComponent(i)));
                }

                return m(".chapter-list", chapters)
            }
        }
    }

    function initChapterList() {
        var comicid = m.route.param("comicid");
        currentComic = ComicList.dict[comicid];
        if (!currentComic) {
            console.error("No such comic ", comicid);
            m.route.set("/");
            return
        }

        console.log("CurrentComic is ", currentComic);
    }

    function oninit() {
        if (ComicList.initialized) {
            initChapterList();
            return;
        }
        else {
            ComicList.initComics().then(initChapterList);
        }
    }

    function scrollToLastReadChapter() {
        if (!currentComic) {
            return;
        }

        console.log("onreate chapter");

        var elem = document.getElementById(getID(currentComic.last_read_chapter));
        elem.classList.add("chapter-last-read");

        var topChapter = 0;
        if (currentComic.last_read_chapter > 10) {
            topChapter = currentComic.last_read_chapter - 10;
        }

        console.log("going to scroll to chapter", topChapter);
        document.getElementById(getID(topChapter)).scrollIntoView({block: "start", inline: "nearest", behavior: "instant"});
    }

    function GetMainComponent() {
        return {
            oninit: oninit,
            view: function() {
                if (!currentComic) {
                    return;
                }

                console.log("chapter view");
                return m(".chapter-container", [
                    m("h1", currentComic.name),
                    m(ChapterListComponent)
                ]);
            },
            oncreate: scrollToLastReadChapter,
            onupdate: scrollToLastReadChapter
        }
    }

    return {GetMainComponent: GetMainComponent};
}();
