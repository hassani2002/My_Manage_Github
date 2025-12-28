// ========== UTILITAIRES ==========
const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");
const email = document.getElementById("email");
const password = document.getElementById("password");

// ========== DONNÉES ==========
const entities = {
  events: ["name", "date", "location"],
  participants: ["name", "email"],
  venues: ["name", "capacity"],
  tickets: ["event", "price"]
};

let currentEntity = null;
let editIndex = null;

const getData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ========== INITIALISATION SÉCURISÉE ==========
function ensureDataInitialized() {
  // Vérifie que toutes les collections existent
  Object.keys(entities).forEach((key) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "[]");
    }
  });
}

function initApp() {
  loginPage.classList.add("hidden");
  app.classList.remove("hidden");
  ensureDataInitialized();
  showDashboard();
}

function showLoginPage() {
  loginPage.classList.remove("hidden");
  app.classList.add("hidden");
}

// Vérification au chargement : auth valide ?
function initializeAuth() {
  const isAuthenticated = localStorage.getItem("auth") === "1";
  
  if (isAuthenticated) {
    // Vérifie qu’au moins une collection existe (sécurité)
    const hasData = Object.keys(entities).some(key => localStorage.getItem(key) !== null);
    if (hasData) {
      initApp();
      return;
    }
  }

  // Sinon : déconnexion propre
  localStorage.removeItem("auth");
  showLoginPage();
}

// ========== AUTHENTIFICATION ==========
function login(e) {
  e.preventDefault();
  if (email.value === "admin@test.com" && password.value === "1234") {
    localStorage.setItem("auth", "1");
    initApp();
  } else {
    alert("Identifiants incorrects");
  }
}

function logout() {
  localStorage.removeItem("auth");
  showLoginPage();
}

// ========== DASHBOARD ==========
function showDashboard() {
  currentEntity = null;
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("entityView").classList.add("hidden");
  updateDashboard();
}

function updateDashboard() {
  const values = [
    getData("events").length,
    getData("participants").length,
    getData("venues").length,
    getData("tickets").length
  ];

  document.getElementById("kEvents").textContent = values[0];
  document.getElementById("kParticipants").textContent = values[1];
  document.getElementById("kVenues").textContent = values[2];
  document.getElementById("kTickets").textContent = values[3];

  const ctx = document.getElementById("chart").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Événements", "Participants", "Salles", "Billets"],
      datasets: [{
        label: "Statistiques",
        data: values,
        backgroundColor: ["#6366f1", "#22c55e", "#f97316", "#0ea5e9"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ========== ENTITÉS ==========
function showEntity(entityName) {
  currentEntity = entityName;
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("entityView").classList.remove("hidden");
  document.getElementById("entityTitle").textContent = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  renderTable();
}

function renderTable() {
  const data = getData(currentEntity);
  const head = document.getElementById("tableHead");
  const body = document.getElementById("tableBody");

  head.innerHTML = entities[currentEntity]
    .map(field => `<th>${field}</th>`)
    .join("") + "<th>Actions</th>";

  body.innerHTML = data.map((item, index) => `
    <tr>
      ${entities[currentEntity].map(field => `<td>${item[field] || ''}</td>`).join("")}
      <td>
        <button onclick="editItem(${index})">✏️</button>
        <button onclick="deleteItem(${index})">🗑️</button>
      </td>
    </tr>
  `).join("");
}

// ========== MODAL ==========
function openModal() {
  if (!currentEntity) {
    alert("Choisissez une section avant d’ajouter.");
    return;
  }
  editIndex = null;
  openFormModal("Ajouter");
}

function editItem(index) {
  editIndex = index;
  openFormModal("Modifier");
}

function openFormModal(title) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("form");

  modalTitle.textContent = title;
  const data = editIndex !== null ? getData(currentEntity)[editIndex] : null;

  form.innerHTML = entities[currentEntity]
    .map(field => {
      const value = data ? (data[field] || '') : '';
      return `<input name="${field}" placeholder="${field}" value="${value}" required>`;
    })
    .join("") + `<button type="submit">${title}</button>`;

  modal.classList.remove("hidden");
}

function closeModal(e) {
  if (e.target.id === "modal") {
    document.getElementById("modal").classList.add("hidden");
  }
}

// ========== CRUD ==========
function saveItem(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const obj = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }

  const data = getData(currentEntity);
  if (editIndex === null) {
    data.push(obj);
  } else {
    data[editIndex] = obj;
  }
  saveData(currentEntity, data);

  document.getElementById("modal").classList.add("hidden");
  if (currentEntity) renderTable();
  updateDashboard();
}

function deleteItem(index) {
  if (confirm("Supprimer cet élément ?")) {
    const data = getData(currentEntity);
    data.splice(index, 1);
    saveData(currentEntity, data);
    renderTable();
    updateDashboard();
  }
}

// ========== LANCEMENT ==========
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
});