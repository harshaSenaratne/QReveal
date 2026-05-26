package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type logFieldsKey struct{}

type LogFields struct {
	FileSize      int64
	MIMEType      string
	ErrorCategory string
}

func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fields := &LogFields{}
		ctx := context.WithValue(r.Context(), logFieldsKey{}, fields)
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		startedAt := time.Now()

		next.ServeHTTP(recorder, r.WithContext(ctx))

		entry := map[string]interface{}{
			"timestamp":      startedAt.UTC().Format(time.RFC3339Nano),
			"duration_ms":    time.Since(startedAt).Milliseconds(),
			"file_size":      fields.FileSize,
			"mime_type":      fields.MIMEType,
			"status":         recorder.status,
			"error_category": fields.ErrorCategory,
		}

		payload, err := json.Marshal(entry)
		if err != nil {
			log.Print(`{"error_category":"INTERNAL_ERROR"}`)
			return
		}

		log.Print(string(payload))
	})
}

func SetUploadMetadata(ctx context.Context, fileSize int64, mimeType string) {
	fields, ok := ctx.Value(logFieldsKey{}).(*LogFields)
	if !ok {
		return
	}

	fields.FileSize = fileSize
	if mimeType != "" {
		fields.MIMEType = mimeType
	}
}

func SetErrorCategory(ctx context.Context, category string) {
	fields, ok := ctx.Value(logFieldsKey{}).(*LogFields)
	if !ok {
		return
	}

	fields.ErrorCategory = category
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Write(body []byte) (int, error) {
	if r.status == 0 {
		r.status = http.StatusOK
	}
	return r.ResponseWriter.Write(body)
}
