var ComicListView = function() {

    function BuildComicComponent(comic) {
        var thumbnail = "/comicfs/" + comic.id + "/" + comic.thumbnail;
        function onComicClicked() {
            console.info("you clicked comic", comic)
            m.route.set("/comic/:comicid", {comicid: comic.id});
        }

        return {
            view: function() {
                return m(".comic-list-item", {onclick: onComicClicked}, [
                    m(".comic-thumbnail", m("img", {src:thumbnail})),
                    m(".comic-title", comic.name)
                ])
            }
        }
    }

    function ComicListComponent() {
        return {
            view: function() {
                var comics = ComicList.list.map(function(comic) {
                    return m(BuildComicComponent(comic));
                });

                return m(".comic-list", comics)
            }
        }
    }

    function SearchComponent() {
        var searchTerm = "";
        var searchTimeout = null;
        
        function doSearch() {
            var filteredList = [];
            if (searchTerm == "") {
                filteredList = ComicList.fullList;
            } else {
                filteredList = ComicList.fullList.filter((comic) => { return comic.name.includes(searchTerm); });
            }

            ComicList.list = filteredList;
            m.redraw();
        }
     
        return {
            view: function() {
                var input = m("input", {
                    type: "text",
                    id: "search-bar-input",
                    oninput: function (e) {
                        e.redraw = false;
                        searchTerm = e.target.value
                        if (searchTimeout != null) {
                            clearTimeout(searchTimeout);
                            searchTimeout = null;
                        }
                        searchTimeout = setTimeout(doSearch, 1000);
                    },
                    value: searchTerm
                });

                var btn = m("button", {id: "search-bar-btn", onclick: doSearch}, m("i", {class: "fa fa-search"}));
                return m(".search-bar", [input, btn])
            }
        }
    }

    function GetMainComponent() {

        return {
            oninit: ComicList.initComics,
            view: function() {
                return m(".list-container", [
                    m(SearchComponent),
                    m(ComicListComponent)
                ])
            }
        }
    }

    return { GetMainComponent: GetMainComponent };

}();
