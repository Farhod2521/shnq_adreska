#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env.production"

docker compose --env-file "$ENV_FILE" run --rm certbot renew --webroot -w /var/www/certbot --quiet
docker compose --env-file "$ENV_FILE" exec nginx nginx -s reload
