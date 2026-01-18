package auth

import (
	"context"
	"fmt"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type IDToken interface {
	Claims(v interface{}) error
}

type Provider interface {
	AuthCodeURL(state string) string
	Exchange(ctx context.Context, code string) (*oauth2.Token, error)
	VerifyToken(ctx context.Context, rawIDToken string) (IDToken, error)
}

type OIDCProvider struct {
	Provider     *oidc.Provider
	Verifier     *oidc.IDTokenVerifier
	OAuth2Config oauth2.Config
}

func NewOIDCProvider(ctx context.Context) (*OIDCProvider, error) {
	issuer := os.Getenv("OIDC_ISSUER")
	clientID := os.Getenv("OIDC_CLIENT_ID")
	clientSecret := os.Getenv("OIDC_CLIENT_SECRET")
	redirectURL := os.Getenv("OIDC_REDIRECT_URL")

	if issuer == "" && clientID == "" {
		return nil, nil
	}

	if issuer == "" || clientID == "" {
		return nil, fmt.Errorf("OIDC_ISSUER and OIDC_CLIENT_ID must be set")
	}

	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, fmt.Errorf("failed to get provider: %v", err)
	}

	oidcConfig := &oidc.Config{
		ClientID: clientID,
	}
	verifier := provider.Verifier(oidcConfig)

	config := oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  redirectURL,
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	return &OIDCProvider{
		Provider:     provider,
		Verifier:     verifier,
		OAuth2Config: config,
	}, nil
}

func (p *OIDCProvider) AuthCodeURL(state string) string {
	return p.OAuth2Config.AuthCodeURL(state)
}

func (p *OIDCProvider) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	return p.OAuth2Config.Exchange(ctx, code)
}

func (p *OIDCProvider) VerifyToken(ctx context.Context, rawIDToken string) (IDToken, error) {
	return p.Verifier.Verify(ctx, rawIDToken)
}
