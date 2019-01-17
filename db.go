package main

import (
	"encoding/json"
	"io/ioutil"
	"path/filepath"
	"sort"
	"time"

	"github.com/boltdb/bolt"
	log "github.com/inconshreveable/log15"
)

type Comic struct {
	Name        string `json:"name"`
	ID          string `json:"id"`
	NumChapters int    `json:"num_chapters"`
	Thumbnail   string `json:"thumbnail"`
}

type Progress struct {
	ComicID         string    `json:"comic_id"`
	LastReadChapter int       `json:"last_read_chapter"`
	LastReadAt      time.Time `json:"last_read_at"`
}

type DB struct {
	DBName   string
	ComicDir string
	bdb      *bolt.DB
}

func (db *DB) Init() error {
	bdb, err := bolt.Open(db.DBName, 0600, nil)
	if err != nil {
		return err
	}

	db.bdb = bdb

	if err := db.initBuckets(); err != nil {
		return err
	}

	if err := db.updateCatalog(); err != nil {
		return err
	}

	return nil
}

func (db *DB) initBuckets() error {
	buckets := []string{"progress", "comics"}
	err := db.bdb.Update(func(tx *bolt.Tx) error {
		for _, bucket := range buckets {
			if _, err := tx.CreateBucketIfNotExists([]byte(bucket)); err != nil {
				return err
			}
		}
		return nil
	})

	return err
}

func (db *DB) updateCatalog() error {
	files, err := ioutil.ReadDir(db.ComicDir)
	if err != nil {
		return err
	}

	err = db.bdb.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("comics"))
		for _, f := range files {
			if !f.IsDir() {
				continue
			}

			// TODO check timestamp and update only if meta has been updated since last
			// check
			dirname := f.Name()
			metapath := filepath.Join(db.ComicDir, dirname, "comic.json")
			metadata, err := ioutil.ReadFile(metapath)
			if err != nil {
				continue
			}

			if err := bucket.Put([]byte(dirname), metadata); err != nil {
				return err
			}
			log.Info("updated catalog with comic", "path", metapath)
		}
		return nil
	})

	return err
}

type ComicListEntry struct {
	Name            string    `json:"name"`
	ID              string    `json:"id"`
	Thumbnail       string    `json:"thumbnail"`
	NumChapters     int       `json:"num_chapters"`
	LastReadChapter int       `json:"last_read_chapter"`
	LastReadAt      time.Time `json:"last_read_at"`
}

func (db *DB) UpdateProgress(p *Progress) error {
	return db.bdb.Update(func(tx *bolt.Tx) error {
		// TODO what if ID is not a valid comic?
		jp, err := json.Marshal(p)
		if err != nil {
			return err
		}

		bucket := tx.Bucket([]byte("progress"))
		return bucket.Put([]byte(p.ComicID), jp)
	})
}
func (db *DB) ListComics() ([]*ComicListEntry, error) {
	// TODO paginate?
	comicMap := make(map[string]*ComicListEntry)
	err := db.bdb.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("comics"))
		return bucket.ForEach(func(k, v []byte) error {
			comic := &Comic{}
			if err := json.Unmarshal(v, comic); err != nil {
				return err
			}

			comicMap[comic.ID] = &ComicListEntry{
				Name:        comic.Name,
				ID:          comic.ID,
				NumChapters: comic.NumChapters,
				Thumbnail:   comic.Thumbnail,
			}

			return nil
		})
	})

	if err != nil {
		return nil, err
	}

	err = db.bdb.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("progress"))
		return bucket.ForEach(func(k, v []byte) error {
			progress := &Progress{}
			if err := json.Unmarshal(v, progress); err != nil {
				return err
			}

			if comicEntry, ok := comicMap[progress.ComicID]; ok {
				comicEntry.LastReadAt = progress.LastReadAt
				comicEntry.LastReadChapter = progress.LastReadChapter
			}

			return nil
		})
	})

	if err != nil {
		return nil, err
	}

	comicList := make([]*ComicListEntry, len(comicMap))
	i := 0
	for _, v := range comicMap {
		comicList[i] = v
		i += 1
	}

	sort.SliceStable(comicList, func(i, j int) bool {
		return comicList[i].Name < comicList[j].Name
	})

	sort.SliceStable(comicList, func(i, j int) bool {
		// using i > j since we want it in descending order
		return comicList[i].LastReadAt.After(comicList[j].LastReadAt)
	})

	return comicList, nil
}
