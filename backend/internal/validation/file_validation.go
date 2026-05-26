package validation

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/harshaSenaratne/qreveal/backend/internal/response"
)

type UploadValidationError struct {
	Code    string
	Message string
}

func (e *UploadValidationError) Error() string {
	return e.Code
}

func ReadMultipartFile(r *http.Request, fieldName string, maxBytes int64) ([]byte, int64, *UploadValidationError, error) {
	reader, err := r.MultipartReader()
	if err != nil {
		return nil, 0, &UploadValidationError{
			Code:    response.CodeNoFile,
			Message: response.MessageNoFile,
		}, nil
	}

	for {
		part, err := reader.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			if isRequestTooLarge(err) {
				return nil, maxBytes + 1, fileTooLargeError(), nil
			}
			return nil, 0, nil, err
		}

		if part.FormName() != fieldName {
			_ = part.Close()
			continue
		}

		defer part.Close()

		var buffer bytes.Buffer
		observedSize, err := buffer.ReadFrom(io.LimitReader(part, maxBytes+1))
		if err != nil {
			if isRequestTooLarge(err) {
				return nil, maxBytes + 1, fileTooLargeError(), nil
			}
			return nil, observedSize, nil, err
		}

		if observedSize > maxBytes {
			return nil, observedSize, fileTooLargeError(), nil
		}

		return buffer.Bytes(), observedSize, nil, nil
	}

	return nil, 0, &UploadValidationError{
		Code:    response.CodeNoFile,
		Message: response.MessageNoFile,
	}, nil
}

func ValidateImage(fileBytes []byte, maxBytes int64) (string, *UploadValidationError) {
	if len(fileBytes) == 0 {
		return "", &UploadValidationError{
			Code:    response.CodeEmptyFile,
			Message: response.MessageEmptyFile,
		}
	}

	if int64(len(fileBytes)) > maxBytes {
		return "", fileTooLargeError()
	}

	sniffLength := min(len(fileBytes), 512)
	mimeType := http.DetectContentType(fileBytes[:sniffLength])

	switch mimeType {
	case "image/png", "image/jpeg":
		return mimeType, nil
	default:
		return mimeType, &UploadValidationError{
			Code:    response.CodeUnsupportedFileType,
			Message: response.MessageUnsupportedFileType,
		}
	}
}

func fileTooLargeError() *UploadValidationError {
	return &UploadValidationError{
		Code:    response.CodeFileTooLarge,
		Message: response.MessageFileTooLarge,
	}
}

func isRequestTooLarge(err error) bool {
	var maxBytesErr *http.MaxBytesError
	return errors.As(err, &maxBytesErr) || errors.Is(err, http.ErrBodyReadAfterClose) || fmt.Sprint(err) == "http: request body too large"
}
