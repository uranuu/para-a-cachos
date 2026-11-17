#!/usr/bin/env python3
"""Servidor do site para Kamilly (Cachos) e Matteo."""

from __future__ import annotations

import json
import random
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent
DADOS = RAIZ / "dados"
RECADOS = DADOS / "recados.json"
PORTA = 8765

NOMES = {
    "ela": "Kamilly",
    "apelido": "Cachos",
    "filho": "Matteo",
    "familia": "Kamilly, Matteo e eu",
}


def ler_json(caminho: Path, padrao):
    if not caminho.exists():
        return padrao
    return json.loads(caminho.read_text(encoding="utf-8"))


def poesia_do_dia(agora: datetime | None = None) -> str:
    agora = agora or datetime.now()
    ela, apelido, filho = NOMES["ela"], NOMES["apelido"], NOMES["filho"]
    versos = [
        f"Kamilly, hoje é {agora.strftime('%d/%m/%Y')}.",
        f"Cachos, o meu amor não diminui com o relógio.",
        f"Matteo cresce. Eu quero crescer junto — como pai e como homem ao seu lado.",
        f"Se o dia estiver pesado, encosta. Se estiver leve, ri comigo.",
        f"{ela}, {apelido}, mãe do {filho}: eu te escolho outra vez.",
    ]
    semente = int(agora.strftime("%Y%m%d"))
    rng = random.Random(semente)
    rng.shuffle(versos)
    return " ".join(versos[:3])


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def end_headers(self):
        caminho = urlparse(self.path).path.lower()
        if caminho.endswith(".html") or caminho in ("", "/"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, formato, *args):
        print(f"[site] {self.address_string()} {formato % args}")

    def _json(self, payload, codigo=200):
        corpo = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _ler_corpo(self) -> dict:
        tamanho = int(self.headers.get("Content-Length") or 0)
        if not tamanho:
            return {}
        bruto = self.rfile.read(tamanho)
        try:
            return json.loads(bruto.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_GET(self):
        caminho = urlparse(self.path).path
        if caminho == "/api/quem":
            return self._json({**NOMES, "poesia": poesia_do_dia()})
        if caminho == "/api/poesia":
            return self._json({"texto": poesia_do_dia()})
        if caminho == "/api/frase":
            frases = ler_json(DADOS / "frases.json", [])
            return self._json({"frase": random.choice(frases) if frases else "Eu te amo, Kamilly."})
        if caminho == "/api/motivo":
            motivos = ler_json(DADOS / "motivos.json", [])
            return self._json({"motivo": random.choice(motivos) if motivos else "Porque você é você."})
        if caminho == "/api/motivos":
            return self._json({"motivos": ler_json(DADOS / "motivos.json", [])})
        if caminho == "/api/cartas":
            return self._json({"cartas": ler_json(DADOS / "cartas.json", [])})
        if caminho == "/api/linguagens":
            return self._json({"linguagens": ler_json(DADOS / "linguagens.json", [])})
        if caminho == "/api/recados":
            return self._json({"recados": ler_json(RECADOS, [])})
        if caminho == "/api/executar-python":
            mensagem = (
                f"print('Kamilly, eu te amo.')\n"
                f"print('Cachos, você é o meu lugar.')\n"
                f"print('Matteo, seu pai ama a sua mãe.')\n"
            )
            saida = [
                "Kamilly, eu te amo.",
                "Cachos, você é o meu lugar.",
                "Matteo, seu pai ama a sua mãe.",
            ]
            return self._json({"codigo": mensagem, "saida": "\n".join(saida)})
        if caminho.startswith("/api/"):
            return self._json({"erro": "rota não encontrada"}, 404)
        if caminho == "/":
            self.path = "/index.html"
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        caminho = urlparse(self.path).path
        if caminho != "/api/recado":
            return self._json({"erro": "rota não encontrada"}, 404)
        dados = self._ler_corpo()
        texto = str(dados.get("texto") or "").strip()
        autor = str(dados.get("autor") or "Kamilly").strip()[:80]
        if len(texto) < 2:
            return self._json({"erro": "escreve um pouquinho mais"}, 400)
        recados = ler_json(RECADOS, [])
        recados.append(
            {
                "autor": autor,
                "texto": texto[:2000],
                "quando": datetime.now().isoformat(timespec="seconds"),
            }
        )
        DADOS.mkdir(exist_ok=True)
        RECADOS.write_text(json.dumps(recados, ensure_ascii=False, indent=2), encoding="utf-8")
        return self._json({"ok": True, "recados": recados})


def ip_na_rede() -> str:
    import socket

    try:
        soquete = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        soquete.connect(("8.8.8.8", 80))
        ip = soquete.getsockname()[0]
        soquete.close()
        return ip
    except OSError:
        return "127.0.0.1"


def main():
    DADOS.mkdir(exist_ok=True)
    if not RECADOS.exists():
        RECADOS.write_text("[]", encoding="utf-8")
    servidor = ThreadingHTTPServer(("0.0.0.0", PORTA), Handler)
    local = f"http://127.0.0.1:{PORTA}"
    rede = f"http://{ip_na_rede()}:{PORTA}"
    print(f"Site para Kamilly (Cachos) e Matteo", flush=True)
    print(f"Neste computador: {local}", flush=True)
    print(f"No celular (mesmo Wi-Fi): {rede}", flush=True)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nAté já.")
        servidor.server_close()


if __name__ == "__main__":
    main()
