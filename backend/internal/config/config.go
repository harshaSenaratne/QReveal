package config

import (
	"os"
	"strconv"
	"strings"
)

const (
	defaultPort        = "8080"
	defaultAppEnv      = "development"
	defaultMaxUploadMB = 10
	defaultOrigins     = "http://localhost:3000"
	bytesPerMegabyte   = 1024 * 1024
)

type Config struct {
	Port           string
	AppEnv         string
	MaxUploadMB    int64
	MaxUploadBytes int64
	AllowedOrigins []string
}

func Load() Config {
	maxUploadMB := int64(readInt("MAX_UPLOAD_MB", defaultMaxUploadMB))

	return Config{
		Port:           readString("PORT", defaultPort),
		AppEnv:         readString("APP_ENV", defaultAppEnv),
		MaxUploadMB:    maxUploadMB,
		MaxUploadBytes: maxUploadMB * bytesPerMegabyte,
		AllowedOrigins: readCSV("ALLOWED_ORIGINS", defaultOrigins),
	}
}

func readString(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func readInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}

func readCSV(key, fallback string) []string {
	raw := readString(key, fallback)
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))

	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}

	return values
}
