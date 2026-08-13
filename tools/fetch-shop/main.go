// fetch-shop pulls the real Rocket League item shop (the same way rlshop.gg
// does) using the reverse-engineered internal API (github.com/dank/rlapi).
//
// Usage:
//   go run .            # authenticate via Epic device code, dump catalogue, download images
//   go run . --no-dl    # dump catalogue JSON only, skip image downloads
//   go run . --no-login # non-interactive: fail fast if the saved token is expired
//                       # (used by the auto-refresh so it never blocks on login)
//
// First run prints a URL — open it in a browser, log in with your Epic
// account, and enter the code shown. The refresh token is saved to
// .rlshops-token so later runs skip the login.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dank/rlapi"
)

const tokenFile = ".rlshops-token"

func main() {
	noDownload := flag.Bool("no-dl", false, "only dump the catalogue JSON, skip image downloads")
	noLogin := flag.Bool("no-login", false, "non-interactive: fail fast instead of starting the device login if the saved token is expired (for cron/auto-refresh)")
	flag.Parse()

	slog.SetLogLoggerLevel(slog.LevelWarn)

	egs := rlapi.NewEGS()
	var authToken *rlapi.EOSTokenResponse

	// Reuse a saved EOS refresh token if we have one. The device flow below
	// issues an EOS token, so it must be refreshed with RefreshEOSToken (the
	// EGS refresh path uses a different OAuth client and fails).
	if data, err := os.ReadFile(tokenFile); err == nil {
		refresh := strings.TrimSpace(string(data))
		if refresh != "" {
			token, err := egs.RefreshEOSToken(refresh)
			if err == nil && token != nil && token.AccessToken != "" {
				authToken = token
				// save the rotated refresh token so it never goes stale
				if token.RefreshToken != "" {
					os.WriteFile(tokenFile, []byte(token.RefreshToken), 0o600)
				}
				fmt.Println("authenticated with saved refresh token")
			} else {
				fmt.Println("saved token expired, re-authenticating:", err)
			}
		}
	}

	if authToken == nil {
		if *noLogin {
			log.Fatal("saved Epic token is invalid and --no-login was set — run 'go run .' once in a terminal and complete the browser login to refresh it")
		}
		device, err := egs.AuthenticateWithDevice()
		if err != nil {
			log.Fatal("device auth failed:", err)
		}
		fmt.Printf("1) Open %s in a browser\n", device.VerificationURI)
		fmt.Printf("2) Log in with your Epic Games account\n")
		fmt.Printf("3) Enter this code: %s\n", device.UserCode)
		authToken, err = egs.WaitForDeviceAuthorization(device)
		if err != nil {
			log.Fatal("waiting for device auth failed:", err)
		}
		if authToken.RefreshToken != "" {
			if err := os.WriteFile(tokenFile, []byte(authToken.RefreshToken), 0o600); err != nil {
				fmt.Println("could not save refresh token:", err)
			}
		}
	}

	psyNet := rlapi.NewPsyNet()
	rpc, err := psyNet.AuthPlayer(authToken.AccessToken, authToken.AccountID, "")
	if err != nil {
		log.Fatal("AuthPlayer failed:", err)
	}
	defer rpc.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	shopsResp, err := rpc.GetStandardShops(ctx)
	if err != nil {
		log.Fatal("GetStandardShops failed:", err)
	}
	var shopIDs []rlapi.ShopID
	for _, shop := range shopsResp.Shops {
		shopIDs = append(shopIDs, shop.ID)
	}
	fmt.Printf("shops found: %d\n", len(shopIDs))

	catalog, err := rpc.GetShopCatalogue(ctx, shopIDs)
	if err != nil {
		log.Fatal("GetShopCatalogue failed:", err)
	}

	os.MkdirAll("out", 0o755)
	raw, _ := json.MarshalIndent(catalog, "", "  ")
	os.WriteFile("out/catalogue.json", raw, 0o644)
	fmt.Println("catalogue saved to out/catalogue.json")

	// Full in-game product database: names, quality, slot, and art for every
	// product — used to resolve the individual items the shop refers to.
	// Passing timestamp 0 asks for every product.
	products, err := rpc.GetPlayerProducts(ctx, 0)
	if err != nil {
		fmt.Println("GetPlayerProducts failed (individual item art will be missing):", err)
	} else {
		rawProducts, _ := json.MarshalIndent(products, "", "  ")
		os.WriteFile("out/catalog-full.json", rawProducts, 0o644)
		fmt.Printf("full product database saved: %d products\n", len(products))
	}

	// Shop notifications often carry ImageURLs for items.
	notifications, err := rpc.GetShopNotifications(ctx)
	if err != nil {
		fmt.Println("GetShopNotifications failed:", err)
	} else {
		rawNotes, _ := json.MarshalIndent(notifications, "", "  ")
		os.WriteFile("out/notifications.json", rawNotes, 0o644)
		fmt.Printf("shop notifications saved: %d\n", len(notifications.ShopNotifications))
	}

	// The in-game shop catalog (what the game client renders) — may carry
	// per-item image URLs.
	if mtx, err := rpc.GetMTXCatalog(ctx, ""); err != nil {
		fmt.Println("GetMTXCatalog failed:", err)
	} else {
		rawMtx, _ := json.MarshalIndent(mtx, "", "  ")
		os.WriteFile("out/mtx-catalog.json", rawMtx, 0o644)
		fmt.Printf("MTX catalog saved: %d products\n", len(mtx.MTXProducts))
	}

	if *noDownload {
		return
	}

	os.MkdirAll("out/img", 0o755)
	for _, cat := range catalog.Catalogues {
		for _, item := range cat.ShopItems {
			if item.ImageURL == nil || *item.ImageURL == "" {
				continue
			}
			name := "item"
			if item.Title != nil && *item.Title != "" {
				name = slug(*item.Title)
			}
			dest := filepath.Join("out/img", fmt.Sprintf("%d-%s.png", item.ShopItemID, name))
			if err := download(*item.ImageURL, dest); err != nil {
				fmt.Printf("  image failed %s: %v\n", dest, err)
			} else {
				fmt.Printf("  image saved %s\n", dest)
			}
		}
	}
	fmt.Println("done — images are in out/img/, metadata in out/catalogue.json")
}

func slug(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == ' ' || r == ':' || r == '-':
			b.WriteRune('-')
		}
	}
	return strings.Trim(b.String(), "-")
}

func fetchBytes(url string) ([]byte, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d for %s", resp.StatusCode, url)
	}
	return io.ReadAll(resp.Body)
}

func download(url, dest string) error {
	data, err := fetchBytes(url)
	if err != nil {
		return err
	}
	return os.WriteFile(dest, data, 0o644)
}
