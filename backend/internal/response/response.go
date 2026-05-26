package response

import (
	"encoding/json"
	"net/http"
)

const (
	CodeNoFile              = "NO_FILE"
	CodeEmptyFile           = "EMPTY_FILE"
	CodeFileTooLarge        = "FILE_TOO_LARGE"
	CodeUnsupportedFileType = "UNSUPPORTED_FILE_TYPE"
	CodeNoQRFound           = "NO_QR_FOUND"
	CodeDecodeFailed        = "DECODE_FAILED"
	CodeInternalError       = "INTERNAL_ERROR"
)

const (
	MessageNoFile              = "Please upload a PNG, JPG, or JPEG image."
	MessageEmptyFile           = "The uploaded file is empty."
	MessageFileTooLarge        = "This file is too large. Please upload a file smaller than 10MB."
	MessageUnsupportedFileType = "Unsupported file type. Please upload a PNG, JPG, or JPEG image."
	MessageNoQRFound           = "No QR code was found in this file. Try a clearer image or crop around the QR code."
	MessageServerError         = "Something went wrong while extracting the QR code. Please try again."
)

type ExtractResponse struct {
	Success bool        `json:"success"`
	Results interface{} `json:"results"`
	Error   *ErrorBody  `json:"error,omitempty"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, ExtractResponse{
		Success: false,
		Results: []interface{}{},
		Error: &ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}
