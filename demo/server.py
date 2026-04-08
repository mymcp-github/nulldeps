import http.server
import socketserver
import signal
import os
import threading
from pathlib import Path

# Server is started from repo root, demo/ is the SPA entry point
ROOT = Path(__file__).parent
DEMO_INDEX = ROOT / 'demo' / 'index.html'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve static files from repo root so /src/ and /demo/ are both reachable
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def guess_type(self, path):
        if str(path).endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

    def do_GET(self):
        has_ext = '.' in self.path.split('/')[-1]

        if not has_ext:
            # SPA fallback - always serve demo/index.html for routes without extension
            content = DEMO_INDEX.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        super().do_GET()

    def log_message(self, format, *args):
        pass

def free_port(port: int):
    os.system(f'fuser -k {port}/tcp 2>/dev/null')

if __name__ == '__main__':
    PORT = 3000

    free_port(PORT)

    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(('', PORT), SPAHandler) as httpd:
        def shutdown(sig, frame):
            print('\n🛑 Stopped')
            t = threading.Thread(target=httpd.shutdown)
            t.daemon = True
            t.start()

        signal.signal(signal.SIGINT, shutdown)
        signal.signal(signal.SIGTERM, shutdown)

        print(f'🚀 http://localhost:{PORT}')
        print(f'📁 Root:  {ROOT}')
        print(f'📄 Index: {DEMO_INDEX}')
        httpd.serve_forever()
