var ComicList = {
    list: [],
    fullList: [],
    dict: {},
    initialized: false,
    initComics: function() {
        if (ComicList.initialized) {
            return Promise.resolve(null);
        }

        console.info("initializing comic list");
        return m.request({
            method: "GET",
            url: "/api/list",
        }).then((result) => {
            if (result.success) {
                console.log("Got list of comics", result);
                ComicList.list = [];
                ComicList.fullList = [];

                ComicList.fullList = result.result;
                ComicList.list.push(...ComicList.fullList);
                ComicList.fullList.forEach((item, index) => {
                    ComicList.dict[item.id] = item;
                });

                ComicList.initialized = true;
            } else {
                console.error("Failed to list comics", result);
            }
        });
    }
}
