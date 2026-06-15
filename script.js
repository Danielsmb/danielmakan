// ===== ANTI DEV TOOLS PROTECTION =====
function protectPage() {
    // Mencegah Klik Kanan
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        addTerminalLine('⚠️ Akses ditolak: Klik kanan tidak diizinkan', 'warning');
        return false;
    });

    // Mencegah Shortcut Keyboard Tertentu
    document.addEventListener('keydown', function(e) {
        // Mencegah Ctrl + U, Ctrl + S, Ctrl + P
        if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) {
            e.preventDefault();
            addTerminalLine('⚠️ Shortcut diblokir: ' + e.key, 'warning');
            return false;
        }
        
        // Mencegah F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            addTerminalLine('⚠️ F12 diblokir', 'warning');
            return false;
        }
        
        // Mencegah Ctrl + Shift + I / J / C
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            addTerminalLine('⚠️ Developer Tools diblokir', 'warning');
            return false;
        }
        
        // Mencegah Ctrl + Shift + R (Hard Refresh tanpa cache)
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            addTerminalLine('⚠️ Hard refresh diblokir', 'warning');
            return false;
        }
        
        // Mencegah Ctrl + R (Refresh)
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            addTerminalLine('⚠️ Refresh manual diblokir, gunakan tombol refresh', 'warning');
            return false;
        }
    });
    
    // Deteksi DevTools terbuka (deteksi console.log)
    let devToolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            devToolsOpen = true;
            addTerminalLine('⚠️ DEVTOOLS DETEKSI!', 'error');
            document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #ff0000; font-family: monospace; flex-direction: column;"><h1>🔒 AKSES DITOLAK</h1><p>Developer Tools tidak diizinkan pada halaman ini.</p></div>';
        }
    });
    console.log(element);
}

// ===== STATE MANAGEMENT =====
let sheetData = [];
let filteredData = [];
let currentDetail = null;
let editingId = null;
let debugMode = false;
let currentView = 'menu';
let snowInterval = null;

// Calculator state
let calculatorState = {
    displayValue: '0',
    expression: '',
    previousValue: null,
    operation: null,
    waitingForOperand: false
};

// API Endpoint
const API_ENDPOINT = '/api/menu';

// ===== SNOW EFFECT =====
function createSnow() {
    const snowContainer = document.getElementById('snowContainer');
    if (!snowContainer) return;
    
    // Clear existing snow
    snowContainer.innerHTML = '';
    
    const snowflakeCount = 80;
    
    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.innerHTML = ['❄️', '❅', '❆', '雪'][Math.floor(Math.random() * 4)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.fontSize = (Math.random() * 1.5 + 0.5) + 'rem';
        snowflake.style.animationDuration = (Math.random() * 5 + 3) + 's';
        snowflake.style.animationDelay = (Math.random() * 10) + 's';
        snowflake.style.opacity = Math.random() * 0.6 + 0.2;
        snowContainer.appendChild(snowflake);
    }
}

// ===== SYSTEM TIME & STATUS =====
function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    const timeElement = document.getElementById('systemTime');
    if (timeElement) timeElement.textContent = timeString;
}

function updateSystemStatus(status, type = 'normal') {
    const statusElement = document.getElementById('systemStatus');
    if (statusElement) statusElement.textContent = status;
}

// ===== TERMINAL OUTPUT =====
function addTerminalLine(text, type = 'normal') {
    const terminalBody = document.getElementById('terminalBody');
    if (!terminalBody) return;
    
    const line = document.createElement('div');
    line.classList.add('terminal-line');
    
    const classMap = {
        'error': 'terminal-error',
        'success': 'terminal-success',
        'warning': 'terminal-warning',
        'normal': 'terminal-prompt'
    };
    
    line.innerHTML = `<span class="${classMap[type]}">SYSTEM></span> ${text}`;
    terminalBody.appendChild(line);
    line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== DEBUG PANEL =====
function updateDebugInfo() {
    if (!debugMode) return;
    
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    const cacheData = localStorage.getItem('cybersearch_data');
    const cacheTimestamp = localStorage.getItem('cybersearch_timestamp');
    
    debugInfo.innerHTML = `
        <div>Total Data: ${sheetData.length}</div>
        <div>Filtered: ${filteredData.length}</div>
        <div>Current View: ${currentView}</div>
        <div>Cache: ${cacheData ? 'Available' : 'Empty'}</div>
        <div>Cache Time: ${cacheTimestamp ? new Date(cacheTimestamp).toLocaleString('id-ID') : 'N/A'}</div>
        <div>Protection: ACTIVE 🔒</div>
    `;
}

// ===== NAVIGATION =====
function switchView(view) {
    currentView = view;
    
    // Hide all views
    const views = ['menuView', 'addView', 'calculatorView', 'aboutView'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${view}View`);
    if (selectedView) selectedView.style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });
    
    addTerminalLine(`Switched to ${view} view`, 'normal');
}

// ===== FUZZY SEARCH =====
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function fuzzyMatch(query, text) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(queryLower)) {
        return { match: true, score: 100, type: 'exact' };
    }
    
    const words = textLower.split(/\s+/);
    let bestMatch = { match: false, score: 0, type: 'none' };
    
    for (const word of words) {
        if (word.startsWith(queryLower)) {
            const score = Math.round((queryLower.length / word.length) * 100);
            if (score > bestMatch.score) {
                bestMatch = { match: true, score, type: 'prefix' };
            }
        }
        
        const distance = levenshteinDistance(queryLower, word);
        const similarity = Math.round(((word.length - distance) / Math.max(word.length, queryLower.length)) * 100);
        if (similarity >= 60 && similarity > bestMatch.score) {
            bestMatch = { match: true, score: similarity, type: 'fuzzy' };
        }
    }
    
    return bestMatch;
}

// ===== API CALLS =====
async function fetchMenuData() {
    updateSystemStatus('MENGHUBUNGKAN KE NEON...', 'warning');
    addTerminalLine('Connecting to Neon.tech PostgreSQL...', 'warning');
    
    try {
        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        sheetData = data.map(item => ({
            id: item.id,
            title: String(item.title || '').trim(),
            info: String(item.info || '').trim()
        })).filter(item => item.title);
        
        addTerminalLine(`SUCCESS: Loaded ${sheetData.length} menu items from Neon database`, 'success');
        updateSystemStatus('NEON DATABASE ONLINE', 'success');
        
        localStorage.setItem('cybersearch_data', JSON.stringify(sheetData));
        localStorage.setItem('cybersearch_timestamp', new Date().toISOString());
        
        filteredData = [...sheetData];
        displayMenuItems();
        updateDebugInfo();
        
    } catch (error) {
        addTerminalLine(`ERROR: ${error.message}`, 'error');
        
        const cachedData = localStorage.getItem('cybersearch_data');
        if (cachedData) {
            try {
                sheetData = JSON.parse(cachedData);
                addTerminalLine(`Loaded ${sheetData.length} items from cache`, 'warning');
                updateSystemStatus('OFFLINE MODE (CACHE)', 'warning');
                filteredData = [...sheetData];
                displayMenuItems();
                updateDebugInfo();
                return;
            } catch (e) {
                addTerminalLine(`Cache error: ${e.message}`, 'error');
            }
        }
        
        updateSystemStatus('KONEKSI GAGAL', 'error');
        const loadingContainer = document.getElementById('loadingContainer');
        const noMenu = document.getElementById('noMenu');
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (noMenu) noMenu.style.display = 'block';
    }
}

async function createMenu(title, info) {
    addTerminalLine(`Creating menu: ${title}`, 'normal');
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, info })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const newItem = await response.json();
        addTerminalLine(`SUCCESS: Menu created with ID ${newItem.id}`, 'success');
        
        await fetchMenuData();
        return true;
    } catch (error) {
        addTerminalLine(`ERROR creating menu: ${error.message}`, 'error');
        alert('Gagal menambah menu: ' + error.message);
        return false;
    }
}

async function updateMenu(id, title, info) {
    addTerminalLine(`Updating menu ID ${id}: ${title}`, 'normal');
    
    try {
        const response = await fetch(`${API_ENDPOINT}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, info })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        addTerminalLine(`SUCCESS: Menu ID ${id} updated`, 'success');
        await fetchMenuData();
        return true;
    } catch (error) {
        addTerminalLine(`ERROR updating menu: ${error.message}`, 'error');
        alert('Gagal mengupdate menu: ' + error.message);
        return false;
    }
}

async function deleteMenu(id) {
    if (!confirm(`Yakin ingin menghapus menu ini?`)) return false;
    
    addTerminalLine(`Deleting menu ID ${id}`, 'warning');
    
    try {
        const response = await fetch(`${API_ENDPOINT}?id=${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        addTerminalLine(`SUCCESS: Menu ID ${id} deleted`, 'success');
        await fetchMenuData();
        return true;
    } catch (error) {
        addTerminalLine(`ERROR deleting menu: ${error.message}`, 'error');
        alert('Gagal menghapus menu: ' + error.message);
        return false;
    }
}

// ===== DISPLAY MENU =====
function displayMenuItems() {
    const container = document.getElementById('menuContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const noMenu = document.getElementById('noMenu');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    
    if (filteredData.length === 0) {
        if (container) container.style.display = 'none';
        if (noMenu) noMenu.style.display = 'block';
        return;
    }
    
    if (container) container.style.display = 'grid';
    if (noMenu) noMenu.style.display = 'none';
    
    container.innerHTML = filteredData.map((item, index) => `
        <div class="menu-card" data-index="${index}">
            <div class="menu-icon">${getRandomJapaneseIcon()}</div>
            <h3 class="menu-title">${escapeHtml(item.title)}</h3>
            <div class="menu-preview">${escapeHtml(item.info.substring(0, 100))}${item.info.length > 100 ? '...' : ''}</div>
            <div class="menu-badge">#${index + 1} · ${item.id ? `ID:${item.id}` : ''}</div>
        </div>
    `).join('');
    
    container.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            showDetail(filteredData[index]);
        });
    });
}

function getRandomJapaneseIcon() {
    const icons = ['🍜', '🍣', '🍱', '🥟', '🍙', '🍘', '🍥', '🍢', '🍡', '🍵', '🍶', '🥢'];
    return icons[Math.floor(Math.random() * icons.length)];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== DETAIL MODAL =====
function showDetail(item) {
    currentDetail = item;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailText').textContent = item.info;
    document.getElementById('detailModal').classList.add('show');
    updateDebugInfo();
}

function hideDetail() {
    document.getElementById('detailModal').classList.remove('show');
    currentDetail = null;
}

function copyToClipboard() {
    if (!currentDetail) return;
    
    navigator.clipboard.writeText(currentDetail.info).then(() => {
        const successElement = document.getElementById('copySuccess');
        successElement.classList.add('show');
        addTerminalLine(`Copied: ${currentDetail.info.substring(0, 50)}...`, 'success');
        setTimeout(() => successElement.classList.remove('show'), 2000);
    }).catch(() => {
        addTerminalLine('Failed to copy to clipboard', 'error');
    });
}

// ===== EDIT MODAL =====
function showEditModal(item) {
    editingId = item.id;
    document.getElementById('editMenuTitle').value = item.title;
    document.getElementById('editMenuInfo').value = item.info;
    document.getElementById('editModal').classList.add('show');
}

function hideEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingId = null;
}

async function saveEdit() {
    const title = document.getElementById('editMenuTitle').value.trim();
    const info = document.getElementById('editMenuInfo').value.trim();
    
    if (!title) {
        alert('Judul menu tidak boleh kosong!');
        return;
    }
    
    if (editingId) {
        await updateMenu(editingId, title, info);
        hideEditModal();
        hideDetail();
    }
}

// ===== FILTER =====
function filterMenuItems() {
    const query = document.getElementById('filterInput').value.trim();
    
    if (query === '') {
        filteredData = [...sheetData];
    } else {
        const results = [];
        for (const item of sheetData) {
            const titleMatch = fuzzyMatch(query, item.title);
            const infoMatch = fuzzyMatch(query, item.info);
            const bestMatch = titleMatch.score > infoMatch.score ? titleMatch : infoMatch;
            
            if (bestMatch.match) {
                results.push({ ...item, matchScore: bestMatch.score });
            }
        }
        results.sort((a, b) => b.matchScore - a.matchScore);
        filteredData = results;
    }
    
    displayMenuItems();
    updateDebugInfo();
}

// ===== CALCULATOR =====
function updateCalculatorDisplay() {
    const valueEl = document.getElementById('calculatorValue');
    const exprEl = document.getElementById('calculatorExpression');
    if (valueEl) valueEl.textContent = calculatorState.displayValue;
    if (exprEl) exprEl.textContent = calculatorState.expression;
}

function inputDigit(digit) {
    const { displayValue, waitingForOperand } = calculatorState;
    
    if (waitingForOperand) {
        calculatorState.displayValue = String(digit);
        calculatorState.waitingForOperand = false;
    } else {
        calculatorState.displayValue = displayValue === '0' ? String(digit) : displayValue + digit;
    }
    updateCalculatorDisplay();
}

function inputDecimal() {
    const { displayValue, waitingForOperand } = calculatorState;
    
    if (waitingForOperand) {
        calculatorState.displayValue = '0.';
        calculatorState.waitingForOperand = false;
    } else if (displayValue.indexOf('.') === -1) {
        calculatorState.displayValue = displayValue + '.';
    }
    updateCalculatorDisplay();
}

function clearCalculator() {
    calculatorState = {
        displayValue: '0',
        expression: '',
        previousValue: null,
        operation: null,
        waitingForOperand: false
    };
    updateCalculatorDisplay();
}

function calculate(firstValue, secondValue, operation) {
    switch (operation) {
        case '+': return firstValue + secondValue;
        case '-': return firstValue - secondValue;
        case '*': return firstValue * secondValue;
        case '/': return secondValue !== 0 ? firstValue / secondValue : 0;
        case '%': return firstValue % secondValue;
        default: return secondValue;
    }
}

function performOperation(nextOperation) {
    const { displayValue, previousValue, operation } = calculatorState;
    const inputValue = parseFloat(displayValue);
    
    if (previousValue === null) {
        calculatorState.previousValue = inputValue;
    } else if (operation) {
        const newValue = calculate(previousValue, inputValue, operation);
        calculatorState.displayValue = String(newValue);
        calculatorState.previousValue = newValue;
        calculatorState.expression = `${previousValue} ${operation} ${inputValue} =`;
    }
    
    calculatorState.waitingForOperand = true;
    calculatorState.operation = nextOperation;
    
    if (nextOperation) {
        calculatorState.expression = `${displayValue} ${nextOperation}`;
    }
    updateCalculatorDisplay();
}

function handleEquals() {
    const { displayValue, previousValue, operation } = calculatorState;
    const inputValue = parseFloat(displayValue);
    
    if (previousValue !== null && operation) {
        const newValue = calculate(previousValue, inputValue, operation);
        calculatorState.displayValue = String(newValue);
        calculatorState.expression = `${previousValue} ${operation} ${inputValue} =`;
        calculatorState.previousValue = null;
        calculatorState.operation = null;
        calculatorState.waitingForOperand = true;
    }
    updateCalculatorDisplay();
}

function handleBackspace() {
    const { displayValue } = calculatorState;
    calculatorState.displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
    updateCalculatorDisplay();
}

function handlePercent() {
    const inputValue = parseFloat(calculatorState.displayValue);
    calculatorState.displayValue = String(inputValue / 100);
    updateCalculatorDisplay();
}

// ===== SUBMIT NEW MENU =====
async function submitNewMenu() {
    const title = document.getElementById('newMenuTitle').value.trim();
    const info = document.getElementById('newMenuInfo').value.trim();
    
    if (!title) {
        alert('Judul menu tidak boleh kosong!');
        return;
    }
    
    const success = await createMenu(title, info);
    if (success) {
        document.getElementById('newMenuTitle').value = '';
        document.getElementById('newMenuInfo').value = '';
        switchView('menu');
    }
}

// ===== INITIALIZATION =====
window.onload = function() {
    // Aktifkan proteksi halaman
    protectPage();
    
    // Create snow effect
    createSnow();
    
    // Update time
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });
    
    // Debug toggle
    const debugToggle = document.getElementById('debugToggle');
    if (debugToggle) {
        debugToggle.addEventListener('click', function() {
            debugMode = !debugMode;
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) debugPanel.classList.toggle('show', debugMode);
            updateDebugInfo();
        });
    }
    
    setInterval(updateDebugInfo, 1000);
    
    // Filter input
    const filterInput = document.getElementById('filterInput');
    if (filterInput) {
        let debounceTimer;
        filterInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterMenuItems, 300);
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchMenuData);
    
    // Submit new menu
    const submitNewMenuBtn = document.getElementById('submitNewMenu');
    if (submitNewMenuBtn) submitNewMenuBtn.addEventListener('click', submitNewMenu);
    
    // Detail modal events
    const detailClose = document.getElementById('detailClose');
    if (detailClose) detailClose.addEventListener('click', hideDetail);
    
    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) hideDetail();
        });
    }
    
    const copyButton = document.getElementById('copyButton');
    if (copyButton) copyButton.addEventListener('click', copyToClipboard);
    
    // Edit & Delete buttons
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            if (currentDetail) {
                hideDetail();
                showEditModal(currentDetail);
            }
        });
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (currentDetail && currentDetail.id) {
                const success = await deleteMenu(currentDetail.id);
                if (success) hideDetail();
            }
        });
    }
    
    // Edit modal events
    const editModalClose = document.getElementById('editModalClose');
    if (editModalClose) editModalClose.addEventListener('click', hideEditModal);
    
    const editModalCancel = document.getElementById('editModalCancel');
    if (editModalCancel) editModalCancel.addEventListener('click', hideEditModal);
    
    const editModalSave = document.getElementById('editModalSave');
    if (editModalSave) editModalSave.addEventListener('click', saveEdit);
    
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === this) hideEditModal();
        });
    }
    
    // Calculator buttons
    document.querySelectorAll('.calc-btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.dataset.action;
            
            switch (action) {
                case 'number': inputDigit(this.dataset.value); break;
                case 'decimal': inputDecimal(); break;
                case 'clear': clearCalculator(); break;
                case 'operator': performOperation(this.dataset.value); break;
                case 'equals': handleEquals(); break;
                case 'backspace': handleBackspace(); break;
                case 'percent': handlePercent(); break;
            }
        });
    });
    
    // Fetch data
    fetchMenuData();
    
    addTerminalLine('Kaizen Search initialized. Welcome! 🇯🇵', 'success');
    addTerminalLine('🔒 Page protection ACTIVE', 'warning');
};
