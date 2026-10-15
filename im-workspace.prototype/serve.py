"""Disposable local prototype. Run: python3 serve.py"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial

if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    print('http://127.0.0.1:4176/im-workspace.prototype.html?variant=A', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4176), partial(SimpleHTTPRequestHandler, directory=root)).serve_forever()
