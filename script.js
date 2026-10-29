// === 1. СОСТОЯНИЕ ===
let apartments = [];
let editId = null;

// === 2. ЭЛЕМЕНТЫ ===
const list = document.getElementById('list');
const formTitle = document.getElementById('formTitle');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const editIdInput = document.getElementById('editId');

const nameInput = document.getElementById('name');
const areaInput = document.getElementById('area');
const incomeInput = document.getElementById('income');
const monthsInput = document.getElementById('months');
const mortgageInput = document.getElementById('mortgage');
const utilitiesInput = document.getElementById('utilities');
const expensesInput = document.getElementById('expenses');
const statusInput = document.getElementById('status');
const notesInput = document.getElementById('notes');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const totalProfitEl = document.getElementById('totalProfit');

// === 3. УТИЛИТЫ ===
function formatMoney(num) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(num)) + ' ₽';
}

function loadData() {
  const saved = localStorage.getItem('rentalCRM');
  if (saved) apartments = JSON.parse(saved);
}

function saveData() {
  localStorage.setItem('rentalCRM', JSON.stringify(apartments));
}

// === 4. ОТРИСОВКА ===
function render() {
  list.innerHTML = '';
  
  if (apartments.length === 0) {
    list.innerHTML = '<p class="empty-text">Нет добавленных квартир.</p>';
    updateDashboard(0, 0, 0);
    return;
  }

  let globalIncome = 0;
  let globalExpenses = 0;

  apartments.forEach(apt => {
    if (!apt.oneTimeExpenses) apt.oneTimeExpenses = [];
    const totalOneTime = apt.oneTimeExpenses.reduce((sum, item) => sum + item.amount, 0);

    const incomePerMonth = apt.status === 'free' ? 0 : apt.income; 
    const totalIncome = incomePerMonth * apt.months; 
    const totalUtilities = apt.utilities * apt.months;
    const totalExpensesItems = apt.expenses * apt.months;
    const totalMortgage = apt.mortgage * 12; 
    
    const totalAptExpenses = totalUtilities + totalExpensesItems + totalMortgage + totalOneTime;
    const profit = totalIncome - totalAptExpenses;
    
    globalIncome += totalIncome;
    globalExpenses += totalAptExpenses;

    let oneTimeHtml = '';
    if (apt.oneTimeExpenses.length > 0) {
      oneTimeHtml = `<div class="one-time-list">
        <span class="stat-name">Разовые расходы:</span>
        <ul>${apt.oneTimeExpenses.map((e, i) => 
          `<li>${e.name}: -${formatMoney(e.amount)} <button onclick="deleteOneTime(${apt.id}, ${i})">✕</button></li>`
        ).join('')}</ul>
      </div>`;
    }

    const card = document.createElement('div');
    card.className = `card ${profit >= 0 ? 'profit' : 'loss'}`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">
          ${apt.name} 
          <span class="badge ${apt.status === 'rented' ? 'rented' : 'free'}">
            ${apt.status === 'rented' ? 'Сдана' : 'Пустует'}
          </span>
        </div>
        <div class="card-actions">
          <button class="action-btn" onclick="editApt(${apt.id})">
            ✏️ <span class="btn-text">Изменить</span>
          </button>
          <button class="action-btn delete" onclick="deleteApt(${apt.id})">
            🗑️ <span class="btn-text">Удалить</span>
          </button>
        </div>
      </div>
      
      ${apt.notes ? `<div class="notes">📝 ${apt.notes}</div>` : ''}

      <div class="card-body">
        <div class="stat"><span class="stat-name">Площадь:</span> <span>${apt.area} кв.м</span></div>
        <div class="stat"><span class="stat-name">Цена за кв.м:</span> <span>${formatMoney(apt.income / (apt.area || 1))}</span></div>
        <div class="stat"><span class="stat-name">Доход (в мес):</span> <span class="profit">+ ${formatMoney(incomePerMonth)}</span></div>
        <div class="stat"><span class="stat-name">Сдано:</span> <span>${apt.months} мес.</span></div>
        <div class="stat"><span class="stat-name">Ипотека:</span> <span class="loss">- ${formatMoney(apt.mortgage)}</span></div>
        <div class="stat"><span class="stat-name">Коммуналка:</span> <span class="loss">- ${formatMoney(apt.utilities)}</span></div>
        <div class="stat"><span class="stat-name">Расходники:</span> <span class="loss">- ${formatMoney(apt.expenses)}</span></div>
      </div>

      <div class="one-time-section">
        ${oneTimeHtml}
        <button class="btn-add-expense" onclick="addOneTime(${apt.id})">+ Добавить разовый расход</button>
      </div>

      <div class="total-row">
        <span>Чистая прибыль за год:</span>
        <span class="${profit >= 0 ? 'profit' : 'loss'}">
          ${profit >= 0 ? '+' : ''}${formatMoney(profit)}
        </span>
      </div>
    `;
    list.appendChild(card);
  });

  updateDashboard(globalIncome, globalExpenses, globalIncome - globalExpenses);
}

function updateDashboard(income, expenses, profit) {
  totalIncomeEl.textContent = '+' + formatMoney(income);
  totalExpensesEl.textContent = '-' + formatMoney(expenses);
  totalProfitEl.textContent = (profit >= 0 ? '+' : '') + formatMoney(profit);
  totalProfitEl.className = 'dash-val ' + (profit >= 0 ? 'profit' : 'loss');
}

// === 5. ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ===
addBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return alert('Введите название или адрес!');

  const aptData = {
    id: editId || Date.now(),
    name: name,
    area: Number(areaInput.value) || 0,
    income: Number(incomeInput.value) || 0,
    months: Number(monthsInput.value) || 0,
    mortgage: Number(mortgageInput.value) || 0,
    utilities: Number(utilitiesInput.value) || 0,
    expenses: Number(expensesInput.value) || 0,
    status: statusInput.value,
    notes: notesInput.value.trim(),
    oneTimeExpenses: editId ? apartments.find(a => a.id === editId).oneTimeExpenses : []
  };

  if (editId) {
    const index = apartments.findIndex(a => a.id === editId);
    if (index !== -1) apartments[index] = aptData;
  } else {
    apartments.push(aptData);
  }

  saveData();
  render();
  resetForm();
});

// === 6. РЕДАКТИРОВАНИЕ ===
window.editApt = function(id) {
  const apt = apartments.find(a => a.id === id);
  if (!apt) return;

  editId = id;
  editIdInput.value = id;

  nameInput.value = apt.name;
  areaInput.value = apt.area;
  incomeInput.value = apt.income;
  monthsInput.value = apt.months;
  mortgageInput.value = apt.mortgage;
  utilitiesInput.value = apt.utilities;
  expensesInput.value = apt.expenses;
  statusInput.value = apt.status;
  notesInput.value = apt.notes;

  formTitle.textContent = 'Редактировать квартиру';
  addBtn.textContent = 'Сохранить изменения';
  cancelBtn.classList.remove('hidden');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  editId = null;
  editIdInput.value = '';
  nameInput.value = '';
  areaInput.value = '';
  incomeInput.value = '';
  monthsInput.value = 12;
  mortgageInput.value = '';
  utilitiesInput.value = '';
  expensesInput.value = '';
  statusInput.value = 'rented';
  notesInput.value = '';

  formTitle.textContent = 'Добавить квартиру';
  addBtn.textContent = 'Добавить';
  cancelBtn.classList.add('hidden');
}

// === 7. УДАЛЕНИЕ ===
window.deleteApt = function(id) {
  if (confirm('Удалить эту квартиру?')) {
    apartments = apartments.filter(a => a.id !== id);
    if (editId === id) resetForm();
    saveData();
    render();
  }
};

// === 8. РАЗОВЫЕ РАСХОДЫ ===
window.addOneTime = function(id) {
  const apt = apartments.find(a => a.id === id);
  if (!apt) return;

  const name = prompt('Название расхода (например, "Новый диван"):');
  if (!name) return;

  const amountStr = prompt('Сумма (₽):');
  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) return alert('Введите корректную сумму!');

  apt.oneTimeExpenses.push({ name, amount });
  saveData();
  render();
};

window.deleteOneTime = function(aptId, index) {
  const apt = apartments.find(a => a.id === aptId);
  if (apt) {
    apt.oneTimeExpenses.splice(index, 1);
    saveData();
    render();
  }
};

// === 9. ЗАПУСК ===
loadData();
render();