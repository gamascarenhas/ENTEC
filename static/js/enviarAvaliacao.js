document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".star");
  const observacoesInput = document.getElementById("observacoes");
  const botaoEnviar = document.getElementById("enviarAvaliacao");

  let valorSelecionado = 0;

  // --- Seleção das estrelas ---
  stars.forEach((star, i) => {
    star.addEventListener("click", () => {
      valorSelecionado = i + 1;

      stars.forEach((e, idx) => {
        if (idx < valorSelecionado) e.classList.add("gold");
        else e.classList.remove("gold");
      });

      console.log("Valor selecionado:", valorSelecionado);
    });
  });

  // --- Envio da avaliação ---
  botaoEnviar.addEventListener("click", (e) => {
    e.preventDefault();

    const observacao = observacoesInput.value.trim().slice(0, 300);
    const dataAvaliacao = new Date().toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const avaliacao = {
      estrelas: valorSelecionado,
      observacao: observacao || null,
      data_avaliacao: dataAvaliacao,
    };

    console.log("JSON pronto para envio:", avaliacao);

    fetch("/api/avaliacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avaliacao),
    })
      .then((res) => {
        if (res.ok) {
          console.log("Enviado com sucesso!");
          window.location.href = "/avaliacao/sucesso"; // rota do Flask
        } else {
          console.error("Erro na resposta:", res.status);
          window.location.href = "/avaliacao/erro"; // rota do Flask
        }
      })
      .catch((err) => {
        console.error("Erro ao enviar:", err);
        window.location.href = "/avaliacao/erro"; // erro de rede
      });
  });
});
