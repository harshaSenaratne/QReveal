package handlers

import (
	"errors"
	"net/http"

	"github.com/harshaSenaratne/qreveal/backend/internal/config"
	"github.com/harshaSenaratne/qreveal/backend/internal/decoder"
	"github.com/harshaSenaratne/qreveal/backend/internal/middleware"
	"github.com/harshaSenaratne/qreveal/backend/internal/response"
	"github.com/harshaSenaratne/qreveal/backend/internal/validation"
)

const multipartOverheadBytes int64 = 1024 * 1024

type QRHandler struct {
	decoder        *decoder.QRDecoder
	maxUploadBytes int64
}

func NewQRHandler(cfg config.Config) *QRHandler {
	return &QRHandler{
		decoder:        decoder.NewQRDecoder(),
		maxUploadBytes: cfg.MaxUploadBytes,
	}
}

func (h *QRHandler) Extract(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, h.maxUploadBytes+multipartOverheadBytes)

	fileBytes, observedSize, validationErr, err := validation.ReadMultipartFile(r, "file", h.maxUploadBytes)
	if observedSize > 0 {
		middleware.SetUploadMetadata(r.Context(), observedSize, "")
	}
	if err != nil {
		writeExtractError(w, r, http.StatusInternalServerError, response.CodeInternalError, response.MessageServerError)
		return
	}
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}

	mimeType, validationErr := validation.ValidateImage(fileBytes, h.maxUploadBytes)
	middleware.SetUploadMetadata(r.Context(), int64(len(fileBytes)), mimeType)
	if validationErr != nil {
		writeValidationError(w, r, validationErr)
		return
	}

	results, err := h.decoder.Decode(fileBytes)
	if err != nil {
		if errors.Is(err, decoder.ErrNoQRFound) {
			writeExtractError(w, r, http.StatusUnprocessableEntity, response.CodeNoQRFound, response.MessageNoQRFound)
			return
		}

		writeExtractError(w, r, http.StatusUnprocessableEntity, response.CodeDecodeFailed, response.MessageServerError)
		return
	}

	response.WriteJSON(w, http.StatusOK, response.ExtractResponse{
		Success: true,
		Results: results,
	})
}

func writeValidationError(w http.ResponseWriter, r *http.Request, validationErr *validation.UploadValidationError) {
	status := http.StatusBadRequest
	if validationErr.Code == response.CodeFileTooLarge {
		status = http.StatusRequestEntityTooLarge
	}

	writeExtractError(w, r, status, validationErr.Code, validationErr.Message)
}

func writeExtractError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	middleware.SetErrorCategory(r.Context(), code)
	response.WriteError(w, status, code, message)
}
