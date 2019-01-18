package main

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	log "github.com/inconshreveable/log15"
)

func APIResponse(w http.ResponseWriter, payload interface{}) {
	data := map[string]interface{}{"success": true, "result": payload}
	jdata, err := json.Marshal(data)
	if err != nil {
		log.Error("Failed to marshal data", "payload", payload)
		jdata, _ = json.Marshal(map[string]interface{}{"success": false, "error": err.Error()})
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jdata)
}

func APIError(w http.ResponseWriter, e error) {
	data := map[string]interface{}{"success": false, "error": e.Error()}
	jdata, _ := json.Marshal(data)
	w.Header().Set("Content-Type", "application/json")
	w.Write(jdata)
}

type APIServer struct {
	ComicDir            string
	DecodeImageAtServer bool
	db                  *DB
}

func (s *APIServer) Init() error {
	if _, err := os.Stat(s.ComicDir); os.IsNotExist(err) {
		return err
	}

	s.db = &DB{DBName: "comic.boltdb", ComicDir: s.ComicDir}
	if err := s.db.Init(); err != nil {
		return err
	}

	return nil
}

func (s *APIServer) options(w http.ResponseWriter, req *http.Request) {
	result := make(map[string]interface{})
	result["decode_image_at_server"] = s.DecodeImageAtServer
	APIResponse(w, result)
}

func (s *APIServer) list(w http.ResponseWriter, req *http.Request) {
	comics, err := s.db.ListComics()
	if err != nil {
		log.Error("Failed to list comics from db", "error", err)
		APIError(w, err)
		return
	}

	APIResponse(w, comics)
	return
}

func (s *APIServer) updateProgress(w http.ResponseWriter, req *http.Request) {
	var payload struct {
		Comic   string `json:"comic"`
		Chapter int    `json:"chapter"`
	}

	if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
		APIError(w, err)
		return
	}

	progress := &Progress{
		ComicID:         payload.Comic,
		LastReadChapter: payload.Chapter,
		LastReadAt:      time.Now(),
	}

	if err := s.db.UpdateProgress(progress); err != nil {
		APIError(w, err)
		return
	}

	APIResponse(w, "Successfully updated progress")
}

func (s *APIServer) getHandlers() map[string]func(http.ResponseWriter, *http.Request) {
	return map[string]func(http.ResponseWriter, *http.Request){
		"options":         s.options,
		"list":            s.list,
		"update_progress": s.updateProgress,
	}
}
