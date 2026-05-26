package middleware

import (
	"net/http"

	"github.com/harshaSenaratne/qreveal/backend/internal/response"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				SetErrorCategory(r.Context(), response.CodeInternalError)
				response.WriteError(w, http.StatusInternalServerError, response.CodeInternalError, response.MessageServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
