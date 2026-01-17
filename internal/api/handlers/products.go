package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/gorm"
)

type ProductInput struct {
	Body struct {
		Code  string `json:"code" doc:"Unique product code" example:"D42"`
		Price uint   `json:"price" doc:"Product price" example:"100"`
	}
}

type ProductOutput struct {
	Body database.Product
}

type ProductsOutput struct {
	Body []database.Product
}

func RegisterProducts(api huma.API, db *gorm.DB) {
	// Create product (admin-only)
	huma.Register(api, huma.Operation{
		OperationID: "create-product",
		Method:      http.MethodPost,
		Path:        "/products",
		Summary:     "Create product",
		Description: "Create a new product. Requires admin role.",
		Tags:        []string{"Products"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *ProductInput) (*ProductOutput, error) {
		if _, err := middleware.RequireAdmin(ctx); err != nil {
			return nil, err
		}

		product := database.Product{
			Code:  input.Body.Code,
			Price: input.Body.Price,
		}

		if err := db.Create(&product).Error; err != nil {
			return nil, huma.Error500InternalServerError("Failed to create product", err)
		}

		resp := &ProductOutput{}
		resp.Body = product
		return resp, nil
	})

	// List products
	huma.Get(api, "/products", func(ctx context.Context, input *struct{}) (*ProductsOutput, error) {
		var products []database.Product
		if err := db.Find(&products).Error; err != nil {
			return nil, huma.Error500InternalServerError("Failed to fetch products", err)
		}

		resp := &ProductsOutput{}
		resp.Body = products
		return resp, nil
	})

	// Get product by ID
	huma.Get(api, "/products/{id}", func(ctx context.Context, input *struct {
		ID uint `path:"id" doc:"Product ID"`
	}) (*ProductOutput, error) {
		var product database.Product
		if err := db.First(&product, input.ID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, huma.Error404NotFound("Product not found")
			}
			return nil, huma.Error500InternalServerError("Failed to fetch product", err)
		}

		resp := &ProductOutput{}
		resp.Body = product
		return resp, nil
	})

	// Delete product (admin-only)
	huma.Register(api, huma.Operation{
		OperationID: "delete-product",
		Method:      http.MethodDelete,
		Path:        "/products/{id}",
		Summary:     "Delete product",
		Description: "Delete a product. Requires admin role.",
		Tags:        []string{"Products"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct {
		ID uint `path:"id" doc:"Product ID"`
	}) (*struct{}, error) {
		if _, err := middleware.RequireAdmin(ctx); err != nil {
			return nil, err
		}

		if err := db.Delete(&database.Product{}, input.ID).Error; err != nil {
			return nil, huma.Error500InternalServerError("Failed to delete product", err)
		}
		return nil, nil
	})
}
