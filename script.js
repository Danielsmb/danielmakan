// ===== STATE MANAGEMENT =====
let sheetData = [];
let filteredData = [];
let currentDetail = null;
let editingId = null;
let debugMode = false;

// Calculator state
let calculatorState = {
    displayValue: '0',
    expression: '',
    previousValue: null,
    operation: null,
    waitingForOperand: false
};

// API Endpoint (Vercel Serverless Function)
const API_ENDPOINT = '/api/menu';

// ===== PARTICLE EFFECT =====
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 8 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// ===== SYSTEM TIME & STATUS =====
function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    document.getElementById('systemTime').textContent = timeString;
}

function updateSystemStatus(status, type = 'normal') {
    const statusElement = document.getElementById('systemStatus');
    statusElement.textContent = status;
    
    const colorMap = {
        'error': 'var(--danger-color)',
        'success': 'var(--accent-color)',
        'warning': 'var(--warning-color)',
        'normal': 'var(--primary-color)'
    };
    statusElement.style.color = colorMap[type] || colorMap.normal;
}

// ===== TERMINAL OUTPUT =====
function showTerminalOutput() {
    document.getElementById('terminalOutput').style.display = 'block';
}

function addTerminalLine(text, type = 'normal') {
    const terminal = document.getElementById('terminalOutput');
    const line = document.createElement('div');
    line.classList.add('terminal-line');
    
    const classMap = {
        'error': 'terminal-error',
        'success': 'terminal-success',
        'warning': 'terminal-warning',
        'normal': 'terminal-prompt'
    };
    
    line.innerHTML = `<span class="${classMap[type]}">SYSTEM></span> ${text}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

// ===== DEBUG PANEL =====
function updateDebugInfo() {
    if (!debugMode) return;
    
    const debugInfo = document.getElementById('debugInfo');
    const cacheData = localStorage.getItem('cybersearch_data');
    const cacheTimestamp = localStorage.getItem('cybersearch_timestamp');
    
    debugInfo.innerHTML = `
        <div>Total Data: ${sheetData.length}</div>
        <div>Filtered Data: ${filteredData.length}</div>
        <div>Current Detail: ${currentDetail ? currentDetail.title : 'None'}</div>
        <div>Editing ID: ${editingId || 'None'}</div>
        <div>Cache: ${cacheData ? 'Available' : 'Empty'}</div>
        <div>Cache Time: ${cacheTimestamp ? new Date(cacheTimestamp).toLocaleString('id-ID') : 'N/A'}</div>
        <div>API Endpoint: ${API_ENDPOINT}</div>
    `;
}

// ===== FUZZY SEARCH (LEVENSHTEIN) =====
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

function calculateSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const longer = str1.length > str2.length ? str1 : str2;
    
    if (longer.length === 0) return 100;
    return Math.round(((longer.length - distance) / longer.length) * 100);
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
        
        const similarity = calculateSimilarity(queryLower, word);
        if (similarity >= 60 && similarity > bestMatch.score) {
            bestMatch = { match: true, score: similarity, type: 'fuzzy' };
        }
        
        if (word.includes(queryLower)) {
            const score = Math.round((queryLower.length / word.length) * 90);
            if (score > bestMatch.score) {
                bestMatch = { match: true, score, type: 'contains' };
            }
        }
    }
    
    return bestMatch;
}

// ===== NEON DATABASE API CALLS =====
async function fetchMenuData() {
    updateSystemStatus('MENGHUBUNGKAN KE NEON...', 'warning');
    addTerminalLine('Connecting to Neon.tech PostgreSQL...', 'warning');
    
    try {
        const response = await fetch(API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Normalize data (handle both {title, info} and {title, info, id})
        sheetData = data.map(item => ({
            id: item.id,
            title: String(item.title || '').trim(),
            info: String(item.info || '').trim()
        })).filter(item => item.title);
        
        addTerminalLine(`SUCCESS: Loaded ${sheetData.length} menu items from Neon database`, 'success');
        updateSystemStatus('NEON DATABASE ONLINE', 'success');
        
        // Cache to localStorage
        localStorage.setItem('cybersearch_data', JSON.stringify(sheetData));
        localStorage.setItem('cybersearch_timestamp', new Date().toISOString());
        
        filteredData = [...sheetData];
        displayMenuItems();
        updateDebugInfo();
        
    } catch (error) {
        addTerminalLine(`ERROR: ${error.message}`, 'error');
        console.error('Fetch error:', error);
        
        // Try loading from cache
        const cachedData = localStorage.getItem('cybersearch_data');
        if (cachedData) {
            try {
                sheetData = JSON.parse(cachedData);
                const timestamp = localStorage.getItem('cybersearch_timestamp');
                addTerminalLine(`Loaded ${sheetData.length} items from cache (${new Date(timestamp).toLocaleString('id-ID')})`, 'warning');
                updateSystemStatus('OFFLINE MODE (CACHE)', 'warning');
                filteredData = [...sheetData];
                displayMenuItems();
                updateDebugInfo();
                return;
            } catch (e) {
                addTerminalLine(`Cache error: ${e.message}`, 'error');
            }
        }
        
        // Show error state
        updateSystemStatus('KONEKSI GAGAL', 'error');
        document.getElementById('loadingContainer').style.display = 'none';
        document.getElementById('noMenu').style.display = 'block';
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
    
    loadingContainer.style.display = 'none';
    
    if (filteredData.length === 0) {
        container.style.display = 'none';
        noMenu.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noMenu.style.display = 'none';
    
    container.innerHTML = filteredData.map((item, index) => `
        <div class="menu-card" data-index="${index}">
            <div class="match-indicator">${item.matchType || 'MATCH'}</div>
            <div class="menu-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                </svg>
            </div>
            <h3 class="menu-title">${escapeHtml(item.title)}</h3>
            <div class="menu-preview">${escapeHtml(item.info)}</div>
            <div class="menu-badge">MENU #${index + 1} ${item.id ? `(ID: ${item.id})` : ''}</div>
        </div>
    `).join('');
    
    container.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            showDetail(filteredData[index]);
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== DETAIL MODAL =====
function showDetail(item) {
    currentDetail = item;
    const modal = document.getElementById('detailModal');
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailText').textContent = item.info;
    modal.classList.add('show');
    updateDebugInfo();
    addTerminalLine(`Opening menu: ${item.title}`, 'normal');
}

function hideDetail() {
    document.getElementById('detailModal').classList.remove('show');
    currentDetail = null;
    updateDebugInfo();
}

function copyToClipboard() {
    if (!currentDetail) return;
    
    navigator.clipboard.writeText(currentDetail.info).then(() => {
        const successElement = document.getElementById('copySuccess');
        successElement.classList.add('show');
        addTerminalLine(`Copied: ${currentDetail.info.substring(0, 50)}...`, 'success');
        setTimeout(() => successElement.classList.remove('show'), 2000);
    }).catch(err => {
        addTerminalLine(`ERROR copying: ${err.message}`, 'error');
    });
}

// ===== FORM MODAL =====
function showFormModal(item = null) {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formTitle');
    const titleInput = document.getElementById('menuTitle');
    const infoInput = document.getElementById('menuInfo');
    
    if (item) {
        editingId = item.id;
        title.textContent = 'EDIT MENU';
        titleInput.value = item.title;
        infoInput.value = item.info;
    } else {
        editingId = null;
        title.textContent = 'TAMBAH MENU BARU';
        titleInput.value = '';
        infoInput.value = '';
    }
    
    modal.classList.add('show');
}

function hideFormModal() {
    document.getElementById('formModal').classList.remove('show');
    editingId = null;
}

async function saveForm() {
    const title = document.getElementById('menuTitle').value.trim();
    const info = document.getElementById('menuInfo').value.trim();
    
    if (!title) {
        alert('Judul menu tidak boleh kosong!');
        return;
    }
    
    let success;
    if (editingId) {
        success = await updateMenu(editingId, title, info);
    } else {
        success = await createMenu(title, info);
    }
    
    if (success) {
        hideFormModal();
    }
}

// ===== FILTER =====
function filterMenuItems() {
    const query = document.getElementById('filterInput').value.trim();
    
    if (query === '') {
        filteredData = sheetData.map(item => ({ ...item }));
    } else {
        const results = [];
        
        for (const item of sheetData) {
            const titleMatch = fuzzyMatch(query, item.title);
            const infoMatch = fuzzyMatch(query, item.info);
            const bestMatch = titleMatch.score > infoMatch.score ? titleMatch : infoMatch;
            
            if (bestMatch.match) {
                results.push({
                    ...item,
                    matchScore: bestMatch.score,
                    matchType: bestMatch.type.toUpperCase()
                });
            }
        }
        
        results.sort((a, b) => b.matchScore - a.matchScore);
        filteredData = results;
    }
    
    displayMenuItems();
    updateDebugInfo();
    addTerminalLine(`Filter: "${query}" (${filteredData.length} results)`, 'normal');
}

// ===== CALCULATOR =====
function updateCalculatorDisplay() {
    document.getElementById('calculatorValue').textContent = calculatorState.displayValue;
    document.getElementById('calculatorExpression').textContent = calculatorState.expression;
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

function getOperatorSymbol(operation) {
    const symbols = { '+': '+', '-': '-', '*': '×', '/': '÷', '%': '%' };
    return symbols[operation] || '';
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
        calculatorState.expression = `${previousValue} ${getOperatorSymbol(operation)} ${inputValue} =`;
    }
    
    calculatorState.waitingForOperand = true;
    calculatorState.operation = nextOperation;
    
    if (nextOperation) {
        calculatorState.expression = `${displayValue} ${getOperatorSymbol(nextOperation)}`;
    }
    
    updateCalculatorDisplay();
}

function handleEquals() {
    const { displayValue, previousValue, operation } = calculatorState;
    const inputValue = parseFloat(displayValue);
    
    if (previousValue !== null && operation) {
        const newValue = calculate(previousValue, inputValue, operation);
        calculatorState.displayValue = String(newValue);
        calculatorState.expression = `${previousValue} ${getOperatorSymbol(operation)} ${inputValue} =`;
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

function toggleCalculator() {
    document.getElementById('calculatorContainer').classList.toggle('show');
}

// ===== INITIALIZATION =====
window.onload = function() {
    createParticles();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    showTerminalOutput();
    
    // Debug toggle
    document.getElementById('debugToggle').addEventListener('click', function() {
        debugMode = !debugMode;
        document.getElementById('debugPanel').classList.toggle('show', debugMode);
        updateDebugInfo();
    });
    
    setInterval(updateDebugInfo, 1000);
    
    // Filter input with debounce
    let debounceTimer;
    document.getElementById('filterInput').addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterMenuItems, 300);
    });
    
    // Detail modal events
    document.getElementById('detailClose').addEventListener('click', hideDetail);
    document.getElementById('detailModal').addEventListener('click', function(e) {
        if (e.target === this) hideDetail();
    });
    document.getElementById('copyButton').addEventListener('click', copyToClipboard);
    
    // Edit & Delete buttons
    document.getElementById('editBtn').addEventListener('click', function() {
        if (currentDetail) {
            hideDetail();
            showFormModal(currentDetail);
        }
    });
    
    document.getElementById('deleteBtn').addEventListener('click', async function() {
        if (currentDetail && currentDetail.id) {
            const success = await deleteMenu(currentDetail.id);
            if (success) hideDetail();
        }
    });
    
    // Form modal events
    document.getElementById('addMenuBtn').addEventListener('click', () => showFormModal());
    document.getElementById('refreshBtn').addEventListener('click', fetchMenuData);
    document.getElementById('formClose').addEventListener('click', hideFormModal);
    document.getElementById('formCancel').addEventListener('click', hideFormModal);
    document.getElementById('formSave').addEventListener('click', saveForm);
    document.getElementById('formModal').addEventListener('click', function(e) {
        if (e.target === this) hideFormModal();
    });
    
    // Calculator
    document.getElementById('calculatorToggle').addEventListener('click', toggleCalculator);
    
    document.querySelectorAll('.calculator-btn').forEach(button => {
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
    
    // Fetch data from Neon
    fetchMenuData();
};
