package main

import (
	"calculator/internal/handlers"
	"fmt"
	"net/http"
	"os"

	"github.com/rs/cors"
)

func main() {
	handlers.InitHistory()

	http.HandleFunc("/calculate", handlers.CalculateHandler)
	http.HandleFunc("/history", handlers.HistoryHandler)

	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"https://calculator2-blond.vercel.app",
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Content-Type",
		},
	})

	handler := c.Handler(http.DefaultServeMux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Calculator running on port %s\n", port)

	err := http.ListenAndServe(":"+port, handler)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}
