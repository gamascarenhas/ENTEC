import json

def juntar_avaliacoes_em_pedidos(avaliacoes_file, pedidos_file, output_file="data.json"):
    try:
        
        with open(avaliacoes_file, 'r', encoding='utf-8') as f:
            avaliacoes = json.load(f)
        
        
        with open(pedidos_file, 'r', encoding='utf-8') as f:
            pedidos = json.load(f)

        
        if not isinstance(avaliacoes, list) or not isinstance(pedidos, list):
            raise ValueError("Os dois arquivos devem conter listas JSON.")

        
        avaliacoes_dict = {a["Id"]: a for a in avaliacoes}

      
        pedidos_atualizados = []
        for pedido in pedidos:
            pedido_id = pedido.get("Id")
            avaliacao = avaliacoes_dict.get(pedido_id)

            if avaliacao:
                # Adiciona apenas os campos desejados
                pedido["estrelas"] = avaliacao.get("estrelas")
                pedido["observacao"] = avaliacao.get("observacao")
            # adiciona o pedido (com ou sem avaliação) à lista final
            pedidos_atualizados.append(pedido)

        
        with open(output_file, 'w', encoding='utf-8') as f_out:
            json.dump(pedidos_atualizados, f_out, ensure_ascii=False, indent=2)

       

    except Exception as e:
        print("Erro:", e)


juntar_avaliacoes_em_pedidos("valiações.json", "pedidos.json")