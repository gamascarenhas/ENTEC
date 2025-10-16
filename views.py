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

    # Aqui você pode salvar no banco de dados se quiser
    # Mas, a baixo salva em um arquivo temporário só pra testar
    with open("avaliacoes.txt", "a", encoding="utf-8") as f:
        f.write(str(data) + "\n")

    return jsonify({"status": "ok"}), 200