package handlers

import (
	"encoding/json"
	"net/http"
)

func HistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		getHistory(w)
		return
	}

	if r.Method == http.MethodDelete {
		clearHistory(w)
		return
	}

	writeJSONError(w, "Only GET or DELETE allowed", http.StatusMethodNotAllowed)
}

func getHistory(w http.ResponseWriter) {
	historyMu.Lock()
	historyCopy := make([]CalculateResponse, len(history))
	copy(historyCopy, history)
	historyMu.Unlock()

	w.Header().Set("Content-Type", "application/json")

	err := json.NewEncoder(w).Encode(historyCopy)
	if err != nil {
		writeJSONError(w, "Failed to encode history", http.StatusInternalServerError)
		return
	}
}

func clearHistory(w http.ResponseWriter) {
	historyMu.Lock()
	history = []CalculateResponse{}
	err := clearHistoryCSV()
	historyMu.Unlock()

	if err != nil {
		writeJSONError(w, "Failed to clear history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]string{
		"message": "history cleared",
	})
}
