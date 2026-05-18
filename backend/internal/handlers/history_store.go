package handlers

import (
	"encoding/csv"
	"os"
	"strconv"
)

const historyFile = "history.csv"

func loadHistoryFromCSV() {
	historyMu.Lock()
	defer historyMu.Unlock()

	file, err := os.Open(historyFile)
	if err != nil {
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)

	records, err := reader.ReadAll()
	if err != nil {
		return
	}

	history = []CalculateResponse{}

	for _, record := range records {
		if len(record) != 3 {
			continue
		}

		result, err := strconv.ParseFloat(record[2], 64)
		if err != nil {
			continue
		}

		history = append(history, CalculateResponse{
			ID:         record[0],
			Expression: record[1],
			Result:     result,
		})
	}
}

func appendHistoryToCSV(item CalculateResponse) error {
	file, err := os.OpenFile(historyFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	return writer.Write([]string{
		item.ID,
		item.Expression,
		strconv.FormatFloat(item.Result, 'f', -1, 64),
	})
}

func clearHistoryCSV() error {
	return os.WriteFile(historyFile, []byte{}, 0644)
}

func InitHistory() {
	loadHistoryFromCSV()
}
