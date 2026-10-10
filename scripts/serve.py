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


class DevServer(ThreadingHTTPServer):
    # La cola por defecto es de 5 conexiones: la home pide ~35 archivos a la vez y el navegador
    # recibía ERR_CONNECTION_RESET en algunas imágenes. Con 128 no se pierde ninguna.
    request_queue_size = 128
    daemon_threads = True


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(NoCacheHandler, directory=str(ROOT))
    print(f"Sirviendo {ROOT} en http://localhost:{port}/mockup/  (sin caché)")
    DevServer(("127.0.0.1", port), handler).serve_forever()
