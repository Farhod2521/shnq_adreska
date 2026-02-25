#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env.production"
EXAMPLE_ENV_FILE=".env.production.example"
RENEW_SCRIPT="$ROOT_DIR/deploy/scripts/renew-certs.sh"
CRON_EXPR="0 3 * * * $RENEW_SCRIPT >/var/log/shnq-cert-renew.log 2>&1"

SUDO=""
if [[ "${EUID}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "ERROR: Root huquqi yoki sudo talab qilinadi."
    exit 1
  fi
fi

dc() {
  $SUDO docker compose --env-file "$ENV_FILE" "$@"
}

ensure_openssl() {
  if command -v openssl >/dev/null 2>&1; then
    return
  fi
  $SUDO apt-get update
  $SUDO apt-get install -y openssl
}

install_docker_if_missing() {
  if command -v docker >/dev/null 2>&1 && $SUDO docker compose version >/dev/null 2>&1; then
    echo "Docker va Docker Compose topildi."
    return
  fi

  echo "Docker o'rnatilmoqda..."
  $SUDO apt-get update
  $SUDO apt-get install -y ca-certificates curl gnupg openssl
  $SUDO install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  $SUDO systemctl enable --now docker
}

set_env_value() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >>"$ENV_FILE"
  fi
}

ensure_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$EXAMPLE_ENV_FILE" "$ENV_FILE"
    echo ".env.production yaratildi."
  fi

  # shellcheck disable=SC1090
  source "$ENV_FILE"

  if [[ -z "${POSTGRES_PASSWORD:-}" || "${POSTGRES_PASSWORD}" == "change_me_postgres_password" ]]; then
    set_env_value "POSTGRES_PASSWORD" "$(openssl rand -hex 24)"
  fi

  if [[ -z "${DJANGO_SECRET_KEY:-}" || "${DJANGO_SECRET_KEY}" == "change_me_django_secret" ]]; then
    set_env_value "DJANGO_SECRET_KEY" "$(openssl rand -hex 48)"
  fi

  # shellcheck disable=SC1090
  source "$ENV_FILE"
}

check_dns() {
  local domain="$1"
  local expected_ip="$2"
  local resolved_ip
  resolved_ip="$(getent ahostsv4 "$domain" | awk 'NR==1 {print $1}')"

  if [[ -z "${resolved_ip}" ]]; then
    echo "ERROR: ${domain} uchun DNS IP topilmadi."
    exit 1
  fi

  if [[ "${resolved_ip}" != "${expected_ip}" ]]; then
    echo "ERROR: ${domain} -> ${resolved_ip}, lekin kutilgani ${expected_ip}."
    echo "DNS yozuvlarini to'g'irlab, keyin qayta ishga tushiring."
    exit 1
  fi
}

create_dummy_cert() {
  local domain="$1"
  echo "Dummy sertifikat yaratilmoqda: ${domain}"
  dc run --rm --entrypoint \
    "sh -c 'mkdir -p /etc/letsencrypt/live/${domain} && openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout /etc/letsencrypt/live/${domain}/privkey.pem -out /etc/letsencrypt/live/${domain}/fullchain.pem -subj \"/CN=${domain}\"'" \
    certbot
}

request_real_cert() {
  local domain="$1"
  echo "Let's Encrypt sertifikati olinmoqda: ${domain}"
  dc run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    --email "${LETSENCRYPT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --rsa-key-size 4096 \
    --force-renewal \
    -d "${domain}"
}

setup_cron() {
  chmod +x "$RENEW_SCRIPT"

  local current_cron
  current_cron="$($SUDO crontab -l 2>/dev/null || true)"
  if echo "$current_cron" | grep -Fq "$RENEW_SCRIPT"; then
    echo "Cert renew cron allaqachon mavjud."
    return
  fi

  (
    echo "$current_cron"
    echo "$CRON_EXPR"
  ) | $SUDO crontab -
  echo "Cert renew cron qo'shildi: $CRON_EXPR"
}

open_firewall_ports_if_ufw_active() {
  if command -v ufw >/dev/null 2>&1; then
    local ufw_status
    ufw_status="$($SUDO ufw status | head -n1 || true)"
    if echo "$ufw_status" | grep -qi "Status: active"; then
      $SUDO ufw allow 80/tcp
      $SUDO ufw allow 443/tcp
      $SUDO ufw allow 1000/tcp
      $SUDO ufw allow 1001/tcp
    fi
  fi
}

main() {
  ensure_openssl
  install_docker_if_missing
  ensure_env_file

  # shellcheck disable=SC1090
  source "$ENV_FILE"

  if [[ -z "${LETSENCRYPT_EMAIL:-}" || "${LETSENCRYPT_EMAIL}" == "admin@tmsiti.uz" ]]; then
    echo "ERROR: .env.production ichida LETSENCRYPT_EMAIL ni haqiqiy emailga o'zgartiring."
    exit 1
  fi

  check_dns "${FRONTEND_DOMAIN}" "${SERVER_IP}"
  check_dns "${BACKEND_DOMAIN}" "${SERVER_IP}"

  create_dummy_cert "${FRONTEND_DOMAIN}"
  create_dummy_cert "${BACKEND_DOMAIN}"

  dc up -d --build postgres backend frontend nginx

  request_real_cert "${FRONTEND_DOMAIN}"
  request_real_cert "${BACKEND_DOMAIN}"

  dc exec nginx nginx -s reload

  setup_cron
  open_firewall_ports_if_ufw_active

  echo "Deploy yakunlandi."
  echo "Frontend: https://${FRONTEND_DOMAIN}"
  echo "Backend:  https://${BACKEND_DOMAIN}"
  dc ps
}

main "$@"
