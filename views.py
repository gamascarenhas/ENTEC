from flask import request, jsonify, render_template
from main import app

#rotas
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/avaliacao")
def paginaAvaliacao():
    return render_template("paginaAvaliacao.html")

@app.route("/avaliacao/sucesso")
def paginaSucesso():
    return render_template("paginaSucesso.html")

@app.route("/avaliacao/erro")
def paginaErro():
    return render_template("paginaErro.html")



@app.route('/api/avaliacao', methods=['POST'])
def receber_avaliacao():
    data = request.get_json()
    print("Avaliação recebida:", data)

    import json, os

    arquivo = "avaliacoes.json"
    avaliacoes = []

    if os.path.exists(arquivo):
        with open(arquivo, "r", encoding="utf-8") as f:
            try:
                avaliacoes = json.load(f)
            except json.JSONDecodeError:
                avaliacoes = []

    avaliacoes.append(data)

    with open(arquivo, "w", encoding="utf-8") as f:
        json.dump(avaliacoes, f, ensure_ascii=False, indent=4)

    return jsonify({"status": "ok"}), 200
