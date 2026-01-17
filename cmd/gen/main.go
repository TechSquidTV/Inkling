package main

import (
	"log"

	"github.com/techsquidtv/inkling/internal/database"
	"gorm.io/gen"
)

func main() {
	g := gen.NewGenerator(gen.Config{
		OutPath: "./internal/database/generated",
		Mode:    gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
	})

	// Use the Product model for generation
	g.ApplyBasic(database.Product{})

	// Generate the code
	g.Execute()

	log.Println("GORM code generation completed successfully.")
}
