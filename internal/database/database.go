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

	if err := seedDB(db); err != nil {
		return nil, err
	}

	return db, nil
}

// seedDB populates the database with initial data if empty.
func seedDB(db *gorm.DB) error {
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		admin := User{
			Email: "admin@example.com",
			Name:  "Admin User",
			Role:  RoleAdmin,
		}
		if err := db.Create(&admin).Error; err != nil {
			return err
		}
	}
	return nil
}
