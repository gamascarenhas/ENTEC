from flask import request, jsonify, render_template, redirect, url_for
from main import app
import json



#rotas

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

# --- CADASTRO DE USUÁRIO ---

import re, json, os

def validar_email(email):
    padrao = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(padrao, email) is not None

def validar_senha(senha):
    padrao = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,}$'
    return re.match(padrao, senha) is not None

def email_existe(arquivo, email):
    if not os.path.exists(arquivo):
        return False
    with open(arquivo, "r", encoding="utf-8") as f:
        try:
            dados = json.load(f)
        except json.JSONDecodeError:
            return False
    for usuario in dados:
        if usuario.get("email", "").lower() == email.lower():
            return True
    return False


@app.route("/cadastro", methods=["GET"])
def pagina_cadastro():
    return render_template("cadastro.html")


@app.route("/cadastro", methods=["POST"])
def cadastrar_usuario():
    nome = request.form.get("nome", "").strip()
    email = request.form.get("email", "").strip()
    senha = request.form.get("senha", "")

    if nome == "":
        return "<script>alert('Nome inválido!'); window.history.back();</script>"
    if not validar_email(email):
        return "<script>alert('E-mail inválido!'); window.history.back();</script>"
    if not validar_senha(senha):
        return "<script>alert('Senha inválida! Use 6+ caracteres com maiúscula, minúscula, número e símbolo.'); window.history.back();</script>"

    arquivo = "usuarios.json"

    if email_existe(arquivo, email):
        return "<script>alert('Já existe um usuário com este e-mail!'); window.history.back();</script>"

    dados = []
    if os.path.exists(arquivo):
        with open(arquivo, "r", encoding="utf-8") as f:
            try:
                dados = json.load(f)
            except json.JSONDecodeError:
                dados = []

    novo_usuario = {
        "nome": nome,
        "email": email.lower(),
        "senha": senha
    }

    dados.append(novo_usuario)

    with open(arquivo, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)

    return "<script>alert('Usuário cadastrado com sucesso!'); window.location.href='/login';</script>"

# ------Verificao de login--------------

@app.route("/", methods=['GET', 'POST'])
@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        senha = request.form.get('senha', '')

        # Carregar usuários do arquivo JSON
        with open('usuarios.json', 'r', encoding='utf-8') as file:
            usuarios = json.load(file)

        # Procurar usuário pelo email (case-insensitive)
        usuario_encontrado = None
        for u in usuarios:
            if u.get('email', '').lower() == email.lower():
                usuario_encontrado = u
                break

        if usuario_encontrado is None:
            # email não cadastrado -> mostrar erro no campo email sem recarregar/resetar tudo
            return render_template('login.html', error_field='email', message='E-mail não cadastrado', email=email)
        if usuario_encontrado.get('senha') != senha:
            # senha incorreta -> mostrar erro no campo senha
            return render_template('login.html', error_field='senha', message='Senha incorreta', email=email)

        # Sucesso -> redirecionar para home
        return redirect(url_for('home'))

    # GET -> renderizar sem erros
    return render_template('login.html')