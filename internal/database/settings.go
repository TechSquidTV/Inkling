package database

import (
	"gorm.io/gorm"
)

// Setting keys
const (
	SettingRegistrationEnabled = "registration_enabled"
)

// AppSettings stores application-wide settings as key-value pairs.
type AppSettings struct {
	gorm.Model
	Key   string `json:"key" gorm:"unique;index"`
	Value string `json:"value"`
}

// GetSetting retrieves a setting value by key. Returns defaultValue if not found.
func GetSetting(db *gorm.DB, key string, defaultValue string) string {
	var setting AppSettings
	if err := db.Where("key = ?", key).Limit(1).Find(&setting).Error; err != nil {
		return defaultValue
	}
	if setting.ID == 0 {
		return defaultValue
	}
	return setting.Value
}

// SetSetting creates or updates a setting.
func SetSetting(db *gorm.DB, key string, value string) error {
	var setting AppSettings
	result := db.Where("key = ?", key).Limit(1).Find(&setting)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return result.Error
	}

	if setting.ID == 0 {
		setting = AppSettings{Key: key, Value: value}
		return db.Create(&setting).Error
	}
	setting.Value = value
	return db.Save(&setting).Error
}

// IsRegistrationEnabled checks if user registration is enabled.
func IsRegistrationEnabled(db *gorm.DB) bool {
	return GetSetting(db, SettingRegistrationEnabled, "true") == "true"
}

// SetRegistrationEnabled sets the registration enabled status.
func SetRegistrationEnabled(db *gorm.DB, enabled bool) error {
	value := "false"
	if enabled {
		value = "true"
	}
	return SetSetting(db, SettingRegistrationEnabled, value)
}
