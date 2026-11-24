#!/usr/bin/env bash
# Envia as variáveis de .env.local para o Vercel (production e preview) sem imprimir valores.
set -euo pipefail
while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*([A-Z0-9_]+)=(.*)$ ]] || continue
  name="${BASH_REMATCH[1]}"; val="${BASH_REMATCH[2]}"; val="${val%\"}"; val="${val#\"}"
  [[ "$name" == VERCEL_* ]] && continue
  [[ -z "$val" ]] && { echo "$name=vazio (ignorado)"; continue; }
  for env in production preview; do
    npx vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
    if [[ "$env" == preview ]]; then printf '%s' "$val" | npx vercel env add "$name" preview "" >/dev/null 2>&1 || printf '%s' "$val" | npx vercel env add "$name" preview >/dev/null 2>&1
    else printf '%s' "$val" | npx vercel env add "$name" production >/dev/null 2>&1; fi
  done
  echo "$name=enviado"
done < .env.local
