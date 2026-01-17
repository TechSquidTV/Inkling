package database

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/plugin/opentelemetry/tracing"
)

// DB is the global database instance.
var DB *gorm.DB

// InitDB initializes the SQLite database connection and runs migrations.
func InitDB(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.Use(tracing.NewPlugin()); err != nil {
		return nil, err
	}

	// Auto-migrate models
	err = db.AutoMigrate(&Product{}, &User{}, &APIKey{}, &AppSettings{})
	if err != nil {
		return nil, err
	}

	DB = db
	return db, nil
}
