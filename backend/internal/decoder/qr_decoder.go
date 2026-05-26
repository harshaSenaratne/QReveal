package decoder

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"

	"github.com/makiuchi-d/gozxing"
	multiqrcode "github.com/makiuchi-d/gozxing/multi/qrcode"
	"github.com/makiuchi-d/gozxing/qrcode"
)

var ErrNoQRFound = errors.New("no QR code found")

type QRResult struct {
	Value  string       `json:"value"`
	Type   QRResultType `json:"type"`
	Format string       `json:"format"`
}

type QRDecoder struct{}

func NewQRDecoder() *QRDecoder {
	return &QRDecoder{}
}

func (d *QRDecoder) Decode(data []byte) ([]QRResult, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("decode image: %w", err)
	}

	bitmap, err := gozxing.NewBinaryBitmapFromImage(img)
	if err != nil {
		return nil, fmt.Errorf("create binary bitmap: %w", err)
	}

	zxingResults, err := multiqrcode.NewQRCodeMultiReader().DecodeMultiple(bitmap, map[gozxing.DecodeHintType]interface{}{
		gozxing.DecodeHintType_TRY_HARDER: true,
	})
	if err != nil || len(zxingResults) == 0 {
		singleResult, singleErr := qrcode.NewQRCodeReader().Decode(bitmap, map[gozxing.DecodeHintType]interface{}{
			gozxing.DecodeHintType_TRY_HARDER: true,
		})
		if singleErr != nil {
			if isNotFoundError(err) || isNotFoundError(singleErr) {
				return nil, ErrNoQRFound
			}
			return nil, fmt.Errorf("decode QR: %w", singleErr)
		}

		zxingResults = []*gozxing.Result{singleResult}
	}

	results := make([]QRResult, 0, len(zxingResults))
	seen := make(map[string]struct{}, len(zxingResults))

	for _, zxingResult := range zxingResults {
		if zxingResult == nil {
			continue
		}

		value := zxingResult.GetText()
		if value == "" {
			continue
		}

		key := zxingResult.GetBarcodeFormat().String() + "\x00" + value
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}

		results = append(results, QRResult{
			Value:  value,
			Type:   DetectType(value),
			Format: zxingResult.GetBarcodeFormat().String(),
		})
	}

	if len(results) == 0 {
		return nil, ErrNoQRFound
	}

	return results, nil
}

func isNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	var notFound gozxing.NotFoundException
	return errors.As(err, &notFound)
}
