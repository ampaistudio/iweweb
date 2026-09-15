#!/usr/bin/env python3
"""
Extrae todo el contenido (paginas, posts, medios) de un sitio WordPress
via su API REST nativa y lo guarda como texto plano ordenado por seccion.

Uso:
    python3 scripts/scrape-wp-content.py https://privateyachtexpeditions.com
"""
import sys
import json
import re
import urllib.request
from pathlib import Path

def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

def clean_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&#8230;", "...", text)
    text = re.sub(r"&#\d+;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def fetch_all(base_url: str, endpoint: str):
    items, page = [], 1
    while True:
        url = f"{base_url}/wp-json/wp/v2/{endpoint}?per_page=100&page={page}"
        try:
            batch = fetch_json(url)
        except Exception:
            break
        if not batch:
            break
        items.extend(batch)
        page += 1
    return items

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scrape-wp-content.py https://tudominio.com")
        sys.exit(1)

    base_url = sys.argv[1].rstrip("/")
    out_dir = Path(__file__).parent.parent / "content"
    out_dir.mkdir(exist_ok=True)

    print(f"Consultando {base_url}/wp-json/ ...")

    pages = fetch_all(base_url, "pages")
    posts = fetch_all(base_url, "posts")

    out_file = out_dir / "wp-content-extracted.md"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(f"# Contenido extraido de {base_url}\n\n")

        f.write(f"## Paginas ({len(pages)})\n\n")
        for p in pages:
            title = clean_html(p["title"]["rendered"])
            slug = p["slug"]
            text = clean_html(p["content"]["rendered"])
            f.write(f"### [{p['id']}] {title} (`/{slug}/`)\n\n{text}\n\n---\n\n")

        f.write(f"## Posts / Blog ({len(posts)})\n\n")
        for p in posts:
            title = clean_html(p["title"]["rendered"])
            slug = p["slug"]
            text = clean_html(p["content"]["rendered"])
            f.write(f"### [{p['id']}] {title} (`/{slug}/`)\n\n{text}\n\n---\n\n")

    print(f"Listo: {out_file}")
    print(f"  Paginas: {len(pages)}")
    print(f"  Posts: {len(posts)}")

if __name__ == "__main__":
    main()
