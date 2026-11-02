#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_ROOT="/var/www/html"

if [[ ! -f "$PROJECT_ROOT/index.html" || ! -f "$PROJECT_ROOT/dist/app.html" || ! -d "$PROJECT_ROOT/dist/assets" ]]; then
  echo "Expected index.html and dist/app.html in $PROJECT_ROOT" >&2
  exit 1
fi

sudo dnf install -y httpd
sudo install -d -m 0755 "$WEB_ROOT" "$WEB_ROOT/dist"
sudo install -m 0644 "$PROJECT_ROOT/index.html" "$WEB_ROOT/index.html"
sudo cp -a "$PROJECT_ROOT/dist/." "$WEB_ROOT/dist/"
sudo install -m 0644 "$PROJECT_ROOT/deploy/apache/bijith-invitation.conf" /etc/httpd/conf.d/bijith-invitation.conf
if command -v restorecon >/dev/null 2>&1; then
  sudo restorecon -RF "$WEB_ROOT"
fi
sudo apachectl configtest
if systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --reload
fi
sudo systemctl enable --now httpd
sudo systemctl restart httpd
printf 'Invitation deployed to %s. Open http://<EC2-public-ip>/\n' "$WEB_ROOT"

