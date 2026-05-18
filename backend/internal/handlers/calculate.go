package handlers

import (
	"calculator/internal/evaluate"
	"calculator/internal/validate"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/google/uuid"
)

type CalculateRequest struct {
	Expression string `json:"expression"`
}

type CalculateResponse struct {
	ID         string  `json:"id"`
	Expression string  `json:"expression"`
	Result     float64 `json:"result"`
}

var (
	history   []CalculateResponse
	historyMu sync.Mutex
)

func CalculateHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Request Received")

	if r.Method != http.MethodPost {
		writeJSONError(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CalculateRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		writeJSONError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err = validate.Validate(req.Expression)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	value, err := evaluate.Evaluate(req.Expression)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp := CalculateResponse{
		ID:         uuid.NewString(),
		Expression: req.Expression,
		Result:     value,
	}

	historyMu.Lock()
	history = append(history, resp)
	err = appendHistoryToCSV(resp)
	historyMu.Unlock()

	if err != nil {
		writeJSONError(w, "Failed to save history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	err = json.NewEncoder(w).Encode(resp)
	if err != nil {
		writeJSONError(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
