#!/usr/bin/env bash
# Cambia el color de acento del sitio público (token --lime en src/styles/base.css).
# Todo el sitio consume este único token via var(--lime), así que un solo cambio
# alcanza en todas partes: menú, botones, hovers, sección de reseñas, etc.
#
# Uso:
#   ./scripts/set-accent-color.sh "#f4c430"
#
# Sin argumentos, muestra el valor actual.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_CSS="$REPO_ROOT/src/styles/base.css"

if [ ! -f "$BASE_CSS" ]; then
  echo "No se encontró $BASE_CSS" >&2
  exit 1
fi

CURRENT=$(grep -oE -- '--lime: #[0-9a-fA-F]{3,6};' "$BASE_CSS" | grep -oE '#[0-9a-fA-F]{3,6}')

if [ $# -eq 0 ]; then
  echo "Color actual (--lime): $CURRENT"
  echo "Uso: $0 \"#f4c430\""
  exit 0
fi

NEW_COLOR="$1"

if ! [[ "$NEW_COLOR" =~ ^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$ ]]; then
  echo "Color inválido: '$NEW_COLOR' (formato esperado: #rgb o #rrggbb)" >&2
  exit 1
fi

sed -i.bak -E "s/--lime: #[0-9a-fA-F]{3,6};/--lime: ${NEW_COLOR};/" "$BASE_CSS"
rm -f "$BASE_CSS.bak"

echo "Color actualizado: $CURRENT -> $NEW_COLOR"
echo "Archivo: $BASE_CSS"
echo ""
echo "Verificá con: npm run dev  (o npm run build para producción)"
