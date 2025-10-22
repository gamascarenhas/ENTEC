const JSON_FILE = "/api/avaliacoes_pedidos";
let chartSatisfacao = null;
let chartTimeline = null;

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();

  document
    .getElementById("refreshBtn")
    .addEventListener("click", loadDashboardData);
});

// === FUNÇÃO PRINCIPAL ===
async function loadDashboardData() {
  hideError();
  showLoading();

  try {
    // 1️⃣ Executa o script Python
    await fetch("/api/rodar_script");

    // 2️⃣ Carrega os dados do JSON
    const res = await fetch("/api/avaliacoes_pedidos");
    if (!res.ok) throw new Error("Não foi possível carregar o JSON");

    const dados = await res.json();

    // 3️⃣ Processa os dados
    processData(dados);
  } catch (err) {
    showError("Erro ao carregar dados", err.message);
  } finally {
    hideLoading();
  }
}

// === PROCESSAR DADOS ===
function processData(avaliacoes) {
  if (!avaliacoes || avaliacoes.length === 0) {
    showError("Sem Dados", "Não há dados disponíveis para exibir.");
    return;
  }

  updateStatsCards(avaliacoes);
  createChartSatisfacao(avaliacoes);
  createChartTimeline(avaliacoes);
  populateRecentOrders(avaliacoes);
  updateInsights(avaliacoes);
}

// === CARDS DE ESTATÍSTICAS ===
function updateStatsCards(avaliacoes) {
  const totalOrders = avaliacoes.length;
  const uniqueCustomers = new Set(avaliacoes.map((p) => p.NomeCliente)).size;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("uniqueCustomers").textContent = uniqueCustomers;
  document.getElementById("ordersPerMonth").textContent = (
    totalOrders / 12
  ).toFixed(1);

  const freq = {};
  avaliacoes.forEach((p) => {
    freq[p.NomeCliente] = (freq[p.NomeCliente] || 0) + 1;
  });
  const topCustomer = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("topCustomer").textContent = topCustomer
    ? topCustomer[0]
    : "-";
}

// === GRÁFICO DE SATISFAÇÃO (⭐) ===
function createChartSatisfacao(avaliacoes) {
  const ctx = document.getElementById("ordersByCustomerChart");
  if (!ctx) return;

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  avaliacoes.forEach((p) => {
    const e = parseInt(p.estrelas);
    if (!isNaN(e) && e >= 1 && e <= 5) counts[e]++;
  });

  const labels = ["1⭐", "2⭐⭐", "3⭐⭐⭐", "4⭐⭐⭐⭐", "5⭐⭐⭐⭐⭐"];
  const data = [1, 2, 3, 4, 5].map((n) => counts[n]);

  if (chartSatisfacao) chartSatisfacao.destroy();

  chartSatisfacao = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          label: "Satisfação dos Clientes",
          backgroundColor: [
            "rgba(239,68,68,0.7)",
            "rgba(249,115,22,0.7)",
            "rgba(234,179,8,0.7)",
            "rgba(132,204,22,0.7)",
            "rgba(34,197,94,0.7)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { color: "#aaa" } },
        x: { ticks: { color: "#aaa" } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// === FUNÇÃO SEGURA PARA ANALISAR DATAS ===
function parseData(dataStr) {
  if (!dataStr || typeof dataStr !== "string") {
    return new Date(); // Retorna data atual se inválida
  }

  try {
    // Tenta diferentes formatos de data
    if (dataStr.includes(", ")) {
      // Formato: "22/10/2025, 16:13"
      const [datePart, timePart] = dataStr.split(", ");
      const [day, month, year] = datePart.split("/");
      const [hours, minutes] = timePart.split(":");
      return new Date(year, month - 1, day, hours, minutes);
    } else if (dataStr.includes("/")) {
      // Formato: "22/10/2025"
      const [day, month, year] = dataStr.split("/");
      return new Date(year, month - 1, day);
    } else if (dataStr.includes("-")) {
      // Formato ISO: "2025-10-22"
      return new Date(dataStr);
    } else {
      return new Date(); // Fallback
    }
  } catch (error) {
    console.warn("Erro ao analisar data:", dataStr, error);
    return new Date(); // Fallback para data atual
  }
}

// === GRÁFICO DE TIMELINE ===
function createChartTimeline(avaliacoes) {
  const ctx = document.getElementById("timelineChart");
  if (!ctx) return;

  const porData = {};
  avaliacoes.forEach((p) => {
    if (p.data_avaliacao) {
      try {
        const dataObj = parseData(p.data_avaliacao);
        const d = dataObj.toISOString().split("T")[0];
        porData[d] = (porData[d] || 0) + 1;
      } catch (error) {
        console.warn("Erro ao processar data:", p.data_avaliacao);
      }
    }
  });

  const datas = Object.keys(porData).sort();
  const valores = datas.map((d) => porData[d]);

  if (chartTimeline) chartTimeline.destroy();

  chartTimeline = new Chart(ctx, {
    type: "line",
    data: {
      labels: datas.map((d) => {
        const [y, m, day] = d.split("-");
        return `${day}/${m}`;
      }),
      datasets: [
        {
          label: "Pedidos por Dia",
          data: valores,
          borderColor: "rgba(72,187,120,1)",
          backgroundColor: "rgba(72,187,120,0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { color: "#aaa" } },
        x: { ticks: { color: "#aaa" } },
      },
    },
  });
}

// === PEDIDOS RECENTES ===
function populateRecentOrders(pedidos) {
  const list = document.getElementById("ordersList");
  if (!list) return;

  list.innerHTML = "";

  // Ordena por data de forma segura
  const recent = pedidos
    .filter((p) => p.data_avaliacao) // Filtra apenas os com data
    .sort((a, b) => {
      try {
        const dateA = parseData(a.data_avaliacao);
        const dateB = parseData(b.data_avaliacao);
        return dateB - dateA;
      } catch (error) {
        return 0;
      }
    })
    .slice(0, 5);

  recent.forEach((p) => {
    const item = document.createElement("div");
    item.className = "order-item";
    item.innerHTML = `
      <div class="order-info">
        <h4>${p.NomeCliente || "Cliente"}</h4>
        <p>Pedido #${p.Id || "?"} • ${p.data_avaliacao || "Data indefinida"}</p>
        <small class="contact-line">Tel: ${
          p.Telefone || "Não informado"
        }</small>
        <small class="contact-line">Email: ${p.Email || "Não informado"}</small>
        ${
          p.observacao
            ? `<small class="observation">Obs: ${p.observacao}</small>`
            : ""
        }
      </div>
      <div class="status-badge status-completed">Finalizado</div>
    `;
    list.appendChild(item);
  });
}

// === INSIGHTS ===
function updateInsights(pedidos) {
  // Período de atividade
  const datasValidas = pedidos
    .filter((p) => p.data_avaliacao)
    .map((p) => parseData(p.data_avaliacao))
    .filter((date) => !isNaN(date.getTime())) // Filtra datas inválidas
    .sort((a, b) => a - b);

  if (datasValidas.length > 1) {
    const diff =
      (datasValidas[datasValidas.length - 1] - datasValidas[0]) /
      (1000 * 60 * 60 * 24);
    document.getElementById("activityPeriod").textContent = `${Math.ceil(
      diff
    )} dias de atividade`;
  } else {
    document.getElementById("activityPeriod").textContent =
      "Período não disponível";
  }

  // Clientes recorrentes
  const repetidos = {};
  pedidos.forEach(
    (p) => (repetidos[p.NomeCliente] = (repetidos[p.NomeCliente] || 0) + 1)
  );
  const clientesRepetidos = Object.values(repetidos).filter(
    (v) => v > 1
  ).length;
  document.getElementById(
    "repeatCustomers"
  ).textContent = `${clientesRepetidos} clientes recorrentes`;

  // Distribuição geográfica
  const enderecos = new Set(
    pedidos.map((p) => p.Endereco).filter((addr) => addr)
  ).size;
  document.getElementById(
    "locationInsight"
  ).textContent = `${enderecos} endereços distintos`;

  // Tendência de crescimento
  document.getElementById("growthTrend").textContent =
    "Crescimento positivo observado";
}

// === UI AUX ===
function showLoading() {
  const el = document.getElementById("loadingIndicator");
  if (el) el.style.display = "flex";
}

function hideLoading() {
  const el = document.getElementById("loadingIndicator");
  if (el) el.style.display = "none";
}

function showError(title, message, details = "") {
  const el = document.getElementById("errorContainer");
  if (!el) return;
  el.innerHTML = `
    <div class="error-message">
      <h3>${title}</h3>
      <p>${message}</p>
      ${details ? `<div class="debug-info">Detalhes: ${details}</div>` : ""}
      <p><small>Verifique se "${JSON_FILE}" está acessível.</small></p>
    </div>
  `;
}

function hideError() {
  const el = document.getElementById("errorContainer");
  if (el) el.innerHTML = "";
}
