import json
import os

# --- Caminho da pasta onde o script está ---
caminho_base = os.path.dirname(os.path.abspath(__file__))

# --- Caminhos completos dos arquivos ---
pedidos_path = os.path.join(caminho_base, 'pedidos.json')
avaliacoes_path = os.path.join(caminho_base, 'avaliacoes.json')
saida_path = os.path.join(caminho_base, 'avaliacoes_pedidos.json')

# --- Carregar os JSONs com UTF-8 BOM ---
with open(pedidos_path, 'r', encoding='utf-8-sig') as f:
    pedidos = json.load(f)

with open(avaliacoes_path, 'r', encoding='utf-8-sig') as f:
    avaliacoes = json.load(f)

# --- Criar dicionário de avaliações para acesso rápido ---
avaliacoes_dict = {a["pedido_id"]: a for a in avaliacoes}

# --- Combinar pedidos com avaliações e filtrar nulos ---
avaliacoes_pedidos = []
for pedido in pedidos:
    pedido_id = pedido["Id"]
    avaliacao = avaliacoes_dict.get(pedido_id)
    if avaliacao:
        # Adiciona campos da avaliação diretamente no pedido (camadas planas)
        pedido.update({
            "Id": avaliacao["Id"],
            "estrelas": avaliacao["estrelas"],
            "observacao": avaliacao["observacao"],
            "data_avaliacao": avaliacao["data_avaliacao"]
        })
        avaliacoes_pedidos.append(pedido)  # só adiciona se houver avaliação

# --- Salvar resultado final ---
with open(saida_path, 'w', encoding='utf-8') as f:
    json.dump(avaliacoes_pedidos, f, ensure_ascii=False, indent=4)

print("JSON combinado criado com sucesso!")
