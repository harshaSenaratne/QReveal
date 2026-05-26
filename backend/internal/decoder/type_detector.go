package decoder

import (
	"regexp"
	"strings"
)

type QRResultType string

const (
	QRResultTypeURL     QRResultType = "url"
	QRResultTypeEmail   QRResultType = "email"
	QRResultTypePhone   QRResultType = "phone"
	QRResultTypeWifi    QRResultType = "wifi"
	QRResultTypeText    QRResultType = "text"
	QRResultTypeUnknown QRResultType = "unknown"
)

var (
	emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	phonePattern = regexp.MustCompile(`^\+?[0-9][0-9\s().-]{6,}$`)
	digitPattern = regexp.MustCompile(`[0-9]`)
)

func DetectType(value string) QRResultType {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return QRResultTypeUnknown
	}

	lower := strings.ToLower(trimmed)

	switch {
	case strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://"):
		return QRResultTypeURL
	case strings.HasPrefix(lower, "mailto:") || emailPattern.MatchString(trimmed):
		return QRResultTypeEmail
	case strings.HasPrefix(lower, "tel:") || isPhone(trimmed):
		return QRResultTypePhone
	case strings.HasPrefix(trimmed, "WIFI:"):
		return QRResultTypeWifi
	default:
		return QRResultTypeText
	}
}

func isPhone(value string) bool {
	if !phonePattern.MatchString(value) {
		return false
	}

	return len(digitPattern.FindAllString(value, -1)) >= 7
}
