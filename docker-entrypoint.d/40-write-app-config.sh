#!/bin/sh
set -eu

API_BASE_URL="${APP_API_BASE_URL:-/api}"

cat > /usr/share/nginx/html/app-config.js <<EOF
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
window.__APP_CONFIG__.API_BASE_URL = "${API_BASE_URL}";
EOF
