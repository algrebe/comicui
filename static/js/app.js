window.onload = function () {
    m.route(document.body, "/", {
        "/": ComicListView.GetMainComponent(),
        "/comic/:comicid": ChapterListView.GetMainComponent(),
        "/comic/:comicid/chapter/:chapternum/:key": ChapterView.GetMainComponent()
    });
}
