package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"

	log "github.com/inconshreveable/log15"
)

var Port int
var ComicDir string
var StaticDir string

func bindArgs() {
	var defaultComicDir string
	if curDir, err := os.Getwd(); err != nil {
		panic(err)
	} else {
		defaultComicDir = filepath.Join(curDir, "comics")
	}

	flag.IntVar(&Port, "port", 8888, "port to listen on")
	flag.StringVar(&ComicDir, "comic-dir", defaultComicDir, "directory to all comics")
	flag.StringVar(&StaticDir, "static-dir", "", "if specified, serves /static and /comicfs")
}

//https://play.golang.org/p/EQezfIvN-F
func GetSrcDir() string {
	_, filename, _, _ := runtime.Caller(1)
	return path.Dir(filename)
}

func main() {
	bindArgs()
	flag.Parse()

	apiServer := APIServer{ComicDir: ComicDir}
	if err := apiServer.Init(); err != nil {
		log.Error("Failed to initialize server", "error", err)
		panic(err)
	}

	for path, foo := range apiServer.getHandlers() {
		path = fmt.Sprintf("/api/%s", path)
		log.Info("registering handler", "path", path)
		http.HandleFunc(path, foo)
	}

	if StaticDir != "" {
		staticFileServer := http.FileServer(http.Dir(StaticDir))
		http.Handle("/static/", http.StripPrefix("/static/", staticFileServer))

		comicFileServer := http.FileServer(http.Dir(ComicDir))
		http.Handle("/comicfs/", http.StripPrefix("/comicfs/", comicFileServer))

		splash := filepath.Join(GetSrcDir(), "ui.html")
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, splash)
		})

	}

	log.Info("Starting server", "port", Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", Port), nil); err != nil {
		log.Error("Failed to run server", "error", err)
	}
}
