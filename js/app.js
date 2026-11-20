
/* =========================================
   NUTRICONTROL - SISTEMA PRINCIPAL
   Arquivo: js/app.js
========================================= */


/* 1. ARMAZENAMENTO E DADOS */

const KEYS = {
    invoices: "nutricontrol_invoices",
    products: "nutricontrol_products",
    movements: "nutricontrol_movements"
};

let invoices = Storage.get(KEYS.invoices);
let products = Storage.get(KEYS.products);
let movements = Storage.get(KEYS.movements);

// Garante que os dados recuperados sejam listas
if (!Array.isArray(invoices)) invoices = [];
if (!Array.isArray(products)) products = [];
if (!Array.isArray(movements)) movements = [];


/* 2. FUNÇÕES GERAIS */

function saveAll() {

    const invoicesSaved = Storage.set(KEYS.invoices, invoices);
    const productsSaved = Storage.set(KEYS.products, products);
    const movementsSaved = Storage.set(KEYS.movements, movements);

    if (!invoicesSaved || !productsSaved || !movementsSaved) {
        showToast("Não foi possível salvar todos os dados.", "error");
        return false;
    }

    return true;
}


function money(value) {

    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


function formatDate(date) {

    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


function today() {

    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];

    });

}


function showToast(message, type = "success") {

    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);

}


function openModal(id) {

    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add("open");
    }

}


function closeModal(modal) {

    modal.classList.remove("open");

}


function productById(id) {

    return products.find(product => product.id === id);

}


/* 3. NAVEGAÇÃO ENTRE SEÇÕES */

function navigateTo(pageId) {

    const target = document.getElementById(pageId);

    if (!target || !target.classList.contains("page")) {
        pageId = "dashboard";
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll("[data-page]").forEach(link => {
        link.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(link => {
        link.classList.add("active");
    });

}


document.querySelectorAll("[data-page]").forEach(link => {

    link.addEventListener("click", function () {

        const page = this.dataset.page;

        navigateTo(page);

    });

});


window.addEventListener("hashchange", function () {

    const page = window.location.hash.replace("#", "") || "dashboard";

    navigateTo(page);

});


/* 4. CONTROLE DOS MODAIS */

document.querySelectorAll("[data-close]").forEach(button => {

    button.addEventListener("click", function () {

        const modal = this.closest(".modal");

        if (modal) {
            closeModal(modal);
        }

    });

});


document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            closeModal(modal);
        }

    });

});


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        document.querySelectorAll(".modal.open").forEach(modal => {
            closeModal(modal);
        });

    }

});


/* =========================================
   5. NOTAS FISCAIS
========================================= */

const invoiceForm = document.getElementById("invoice-form");


function renderInvoices(search = "") {

    const list = document.getElementById("invoice-list");

    const filtered = invoices
        .filter(invoice => {

            const number = String(invoice.number || "").toLowerCase();
            const supplier = String(invoice.supplier || "").toLowerCase();

            return (
                number.includes(search.toLowerCase()) ||
                supplier.includes(search.toLowerCase())
            );

        })
        .sort((a, b) => b.date.localeCompare(a.date));

    if (filtered.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Nenhuma nota fiscal encontrada.
                </td>
            </tr>
        `;

        return;

    }

    list.innerHTML = filtered.map(invoice => `

        <tr>

            <td>${escapeHTML(invoice.number)}</td>

            <td>${escapeHTML(invoice.supplier)}</td>

            <td>${formatDate(invoice.date)}</td>

            <td>${money(invoice.value)}</td>

            <td>
                <div class="table-actions">

                    <button
                        class="action-btn"
                        data-edit-invoice="${escapeHTML(invoice.id)}"
                    >
                        Editar
                    </button>

                    <button
                        class="action-btn delete"
                        data-delete-invoice="${escapeHTML(invoice.id)}"
                    >
                        Excluir
                    </button>

                </div>
            </td>

        </tr>

    `).join("");

}


function resetInvoiceForm() {

    invoiceForm.reset();

    document.getElementById("invoice-id").value = "";
    document.getElementById("invoice-date").value = today();

    document.getElementById("invoice-modal-title").textContent = "Nova nota fiscal";

}


document.getElementById("new-invoice-btn").addEventListener("click", function () {

    resetInvoiceForm();

    openModal("invoice-modal");

});


invoiceForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const id = document.getElementById("invoice-id").value;

    const number = document.getElementById("invoice-number").value.trim();
    const date = document.getElementById("invoice-date").value;
    const supplier = document.getElementById("invoice-supplier").value.trim();
    const value = Number(document.getElementById("invoice-value").value);
    const observation = document.getElementById("invoice-observation").value.trim();

    if (!number || !date || !supplier || !Number.isFinite(value) || value <= 0) {

        showToast("Preencha corretamente os campos da nota.", "error");

        return;

    }

    const existing = invoices.find(invoice => invoice.id === id);

    if (existing) {

        Object.assign(existing, {
            number,
            date,
            supplier,
            value,
            observation
        });

    } else {

        invoices.push({

            id: Storage.generateId(),
            number,
            date,
            supplier,
            value,
            observation,
            createdAt: new Date().toISOString()

        });

    }

    if (!saveAll()) return;

    renderInvoices();
    updateDashboard();

    closeModal(document.getElementById("invoice-modal"));

    showToast(existing ? "Nota fiscal atualizada!" : "Nota fiscal cadastrada!");

});


document.getElementById("invoice-search").addEventListener("input", function () {

    renderInvoices(this.value.trim());

});


document.getElementById("invoice-list").addEventListener("click", function (event) {

    const editButton = event.target.closest("[data-edit-invoice]");
    const deleteButton = event.target.closest("[data-delete-invoice]");

    if (editButton) {

        const invoice = invoices.find(item => item.id === editButton.dataset.editInvoice);

        if (!invoice) return;

        document.getElementById("invoice-id").value = invoice.id;
        document.getElementById("invoice-number").value = invoice.number;
        document.getElementById("invoice-date").value = invoice.date;
        document.getElementById("invoice-supplier").value = invoice.supplier;
        document.getElementById("invoice-value").value = invoice.value;
        document.getElementById("invoice-observation").value = invoice.observation || "";

        document.getElementById("invoice-modal-title").textContent = "Editar nota fiscal";

        openModal("invoice-modal");

    }

    if (deleteButton) {

        const id = deleteButton.dataset.deleteInvoice;

        const confirmed = confirm("Deseja realmente excluir esta nota fiscal?");

        if (!confirmed) return;

        invoices = invoices.filter(invoice => invoice.id !== id);

        if (!saveAll()) return;

        renderInvoices();
        updateDashboard();

        showToast("Nota fiscal excluída!");

    }

});


/* =========================================
   6. PRODUTOS E ESTOQUE
========================================= */

const productForm = document.getElementById("product-form");


function renderProducts(search = "") {

    const list = document.getElementById("product-list");

    const filtered = products.filter(product => {

        const name = String(product.name || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();

        return (
            name.includes(search.toLowerCase()) ||
            category.includes(search.toLowerCase())
        );

    });

    if (filtered.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;

    }

    list.innerHTML = filtered.map(product => {

        const stock = Number(product.stock);
        const minimum = Number(product.minimum);

        let status = "badge-success";
        let label = "Normal";

        if (stock <= minimum) {

            status = stock === 0 ? "badge-danger" : "badge-warning";
            label = stock === 0 ? "Sem estoque" : "Estoque baixo";

        }

        return `

            <tr>

                <td>${escapeHTML(product.name)}</td>

                <td>${escapeHTML(product.category)}</td>

                <td>${escapeHTML(product.unit)}</td>

                <td>
                    ${stock.toLocaleString("pt-BR")}
                    <span class="badge ${status}">${label}</span>
                </td>

                <td>${minimum.toLocaleString("pt-BR")}</td>

                <td>

                    <div class="table-actions">

                        <button
                            class="action-btn"
                            data-edit-product="${escapeHTML(product.id)}"
                        >
                            Editar
                        </button>

                        <button
                            class="action-btn delete"
                            data-delete-product="${escapeHTML(product.id)}"
                        >
                            Excluir
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }).join("");

}


function resetProductForm() {

    productForm.reset();

    document.getElementById("product-id").value = "";

    document.getElementById("product-modal-title").textContent = "Novo produto";

}


document.getElementById("new-product-btn").addEventListener("click", function () {

    resetProductForm();

    openModal("product-modal");

});


productForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const id = document.getElementById("product-id").value;

    const name = document.getElementById("product-name").value.trim();
    const category = document.getElementById("product-category").value;
    const unit = document.getElementById("product-unit").value;

    const stock = Number(document.getElementById("product-stock").value);
    const minimum = Number(document.getElementById("product-minimum").value);

    if (
        !name ||
        !category ||
        !unit ||
        !Number.isFinite(stock) ||
        !Number.isFinite(minimum) ||
        stock < 0 ||
        minimum < 0
    ) {

        showToast("Verifique os dados do produto.", "error");

        return;

    }

    const existing = products.find(product => product.id === id);

    if (existing) {

        Object.assign(existing, {
            name,
            category,
            unit,
            stock,
            minimum
        });

    } else {

        products.push({

            id: Storage.generateId(),
            name,
            category,
            unit,
            stock,
            minimum,
            createdAt: new Date().toISOString()

        });

    }

    if (!saveAll()) return;

    renderProducts();
    updateDashboard();
    updateMovementOptions();

    closeModal(document.getElementById("product-modal"));

    showToast(existing ? "Produto atualizado!" : "Produto cadastrado!");

});


document.getElementById("product-search").addEventListener("input", function () {

    renderProducts(this.value.trim());

});


document.getElementById("product-list").addEventListener("click", function (event) {

    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");

    if (editButton) {

        const product = productById(editButton.dataset.editProduct);

        if (!product) return;

        document.getElementById("product-id").value = product.id;
        document.getElementById("product-name").value = product.name;
        document.getElementById("product-category").value = product.category;
        document.getElementById("product-unit").value = product.unit;
        document.getElementById("product-stock").value = product.stock;
        document.getElementById("product-minimum").value = product.minimum;

        document.getElementById("product-modal-title").textContent = "Editar produto";

        openModal("product-modal");

    }

    if (deleteButton) {

        const id = deleteButton.dataset.deleteProduct;

        const confirmed = confirm("Deseja realmente excluir este produto?");

        if (!confirmed) return;

        products = products.filter(product => product.id !== id);

        if (!saveAll()) return;

        renderProducts();
        updateDashboard();
        updateMovementOptions();

        showToast("Produto excluído!");

    }

});


/* =========================================
   7. MOVIMENTAÇÕES DE ESTOQUE
========================================= */

const movementForm = document.getElementById("movement-form");


function updateMovementOptions() {

    const select = document.getElementById("movement-product");

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">Selecione um produto</option>
    `;

    products.forEach(product => {

        const option = document.createElement("option");

        option.value = product.id;
        option.textContent = product.name;

        select.appendChild(option);

    });

    if (products.some(product => product.id === previousValue)) {
        select.value = previousValue;
    }

}


document.getElementById("new-movement-btn").addEventListener("click", function () {

    movementForm.reset();

    updateMovementOptions();

    if (products.length === 0) {

        showToast("Cadastre um produto antes de movimentar o estoque.", "error");

        return;

    }

    openModal("movement-modal");

});


movementForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const productId = document.getElementById("movement-product").value;
    const type = document.getElementById("movement-type").value;

    const quantity = Number(document.getElementById("movement-quantity").value);

    const observation = document.getElementById("movement-observation").value.trim();

    const product = productById(productId);

    if (!product) {

        showToast("Selecione um produto válido.", "error");

        return;

    }

    if (
        !["Entrada", "Saída"].includes(type) ||
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        showToast("Informe o tipo e a quantidade corretamente.", "error");

        return;

    }

    if (type === "Saída" && quantity > Number(product.stock)) {

        showToast("Estoque insuficiente para esta saída!", "error");

        return;

    }

    const previousStock = Number(product.stock);

    if (type === "Entrada") {

        product.stock = previousStock + quantity;

    } else {

        product.stock = previousStock - quantity;

    }

    const movement = {

        id: Storage.generateId(),
        productId: product.id,
        productName: product.name,
        type,
        quantity,
        observation,
        date: new Date().toISOString()

    };

    movements.push(movement);

    if (!saveAll()) {

        // Reverte a alteração se o armazenamento falhar
        product.stock = previousStock;
        movements.pop();

        return;

    }

    renderProducts();
    renderMovements();
    updateDashboard();

    movementForm.reset();

    closeModal(document.getElementById("movement-modal"));

    showToast(`${type} registrada com sucesso!`);

});


function renderMovements() {

    const list = document.getElementById("movement-list");

    const sorted = [...movements].sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    });

    if (sorted.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Nenhuma movimentação registrada.
                </td>
            </tr>
        `;

        return;

    }

    list.innerHTML = sorted.map(movement => {

        const isEntry = movement.type === "Entrada";

        const badge = isEntry ? "badge-success" : "badge-warning";

        return `

            <tr>

                <td>
                    ${new Date(movement.date).toLocaleDateString("pt-BR")}
                </td>

                <td>${escapeHTML(movement.productName)}</td>

                <td>
                    <span class="badge ${badge}">
                        ${escapeHTML(movement.type)}
                    </span>
                </td>

                <td>
                    ${Number(movement.quantity).toLocaleString("pt-BR")}
                </td>

                <td>${escapeHTML(movement.observation || "-")}</td>

            </tr>

        `;

    }).join("");

}


/* =========================================
   8. DASHBOARD
========================================= */

function updateDashboard() {

    document.getElementById("total-invoices").textContent = invoices.length;

    document.getElementById("total-products").textContent = products.length;

    const lowStock = products.filter(product => {

        return Number(product.stock) <= Number(product.minimum);

    });

    document.getElementById("low-stock").textContent = lowStock.length;

    const total = invoices.reduce((sum, invoice) => {

        return sum + Number(invoice.value || 0);

    }, 0);

    document.getElementById("invoice-total").textContent = money(total);


    // Notas fiscais recentes
    const recentInvoices = [...invoices]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    const dashboardList = document.getElementById("dashboard-invoices");

    if (recentInvoices.length === 0) {

        dashboardList.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    Nenhuma nota cadastrada.
                </td>
            </tr>
        `;

    } else {

        dashboardList.innerHTML = recentInvoices.map(invoice => `

            <tr>

                <td>${escapeHTML(invoice.number)}</td>

                <td>${escapeHTML(invoice.supplier)}</td>

                <td>${formatDate(invoice.date)}</td>

                <td>${money(invoice.value)}</td>

            </tr>

        `).join("");

    }


    // Alertas de estoque
    const alertsContainer = document.getElementById("dashboard-alerts");

    if (lowStock.length === 0) {

        alertsContainer.innerHTML = `
            <p class="empty-state">
                Nenhum alerta no momento.
            </p>
        `;

    } else {

        alertsContainer.innerHTML = lowStock.map(product => `

            <div class="alert-item">

                <strong>${escapeHTML(product.name)}</strong>

                <span>
                    Estoque: ${Number(product.stock).toLocaleString("pt-BR")}
                    ${escapeHTML(product.unit)}
                    |
                    Mínimo: ${Number(product.minimum).toLocaleString("pt-BR")}
                </span>

            </div>

        `).join("");

    }

}


/* =========================================
   9. INICIALIZAÇÃO DO SISTEMA
========================================= */

function initializeApp() {

    const initialPage = window.location.hash.replace("#", "") || "dashboard";

    navigateTo(initialPage);

    renderInvoices();
    renderProducts();
    renderMovements();

    updateMovementOptions();

    updateDashboard();

    console.log("NutriControl iniciado com sucesso!");

}


initializeApp();
