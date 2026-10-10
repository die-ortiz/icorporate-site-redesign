#!/usr/bin/env python3
"""Servidor local de desarrollo sin caché: python3 scripts/serve.py [puerto]

Igual que `python3 -m http.server`, pero con Cache-Control: no-store, para que
el navegador siempre muestre la última versión de CSS/JS/HTML al revisar cambios.
Se sirve desde la raíz del proyecto (http://localhost:8000/mockup/).
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(NoCacheHandler, directory=str(ROOT))
    print(f"Sirviendo {ROOT} en http://localhost:{port}/mockup/  (sin caché)")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
