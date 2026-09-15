#!/bin/bash
# Descarga las imágenes de privateyachtexpeditions.com (iWE) a assets/iwe-images
set -e

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/iwe-images"
mkdir -p "$OUT_DIR"

URLS=(
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/09/IWE-CHARLY-EN-BICI-scaled.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4.png"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/4-x-4-Lagos-Off-Road-scaled.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Arcalis-iWE-1.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Bexalis.-ebike-tour.iWE-Lider-en-turismo-activo-en-Andorra-y-los-Pirineos.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/Claror-verano.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG-20210730-WA0045.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG-20210730-WA0065.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG-20210730-WA0074.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG_20160808_112217-scaled-1.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG_20170718_122327.png"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG_20191010_121733-scaled.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/IMG_20200313_173842-scaled-1.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/INCLES.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/JUCLA.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/cropped-Isard-WildLand-Andorra-MTB-Andorra-Winter-Experiences.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/jeep.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2023/10/via-ferrata-3.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2024/01/DSC09590-scaled.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2024/01/IMG-20210729-WA0058.jpg"
  "https://privateyachtexpeditions.com/wp-content/uploads/2024/04/andorra-park-hotel-e1648456217983-removebg-preview.png"
  "https://privateyachtexpeditions.com/wp-content/uploads/2024/04/commencal-logo-vector-xs-removebg-preview.png"
  "https://privateyachtexpeditions.com/wp-content/uploads/2024/04/gratis-png-bicicletas-de-santa-cruz-logo-marca-fuente-santa-cruz-removebg-preview.png"
)

for url in "${URLS[@]}"; do
  filename=$(basename "$url")
  echo "Descargando $filename..."
  if ! curl -sL -f -o "$OUT_DIR/$filename" "$url"; then
    echo "  -> no existe la versión sin sufijo de tamaño, probando con -605x605"
    fallback="${url%.*}-605x605.${url##*.}"
    curl -sL -f -o "$OUT_DIR/$filename" "$fallback" || echo "  -> FALLÓ: $url"
  fi
done

echo "Listo. Imágenes en: $OUT_DIR"
