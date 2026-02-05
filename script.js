const gridContainer = document.getElementById('grid-container');
const shapesDock = document.getElementById('shapes-dock');
const dragGhost = document.getElementById('drag-ghost');
const scoreHeartEl = document.getElementById('score-heart');
const bestEl = document.getElementById('best-score');
const progressEl = document.getElementById('level-progress');
const startMenu = document.getElementById('start-menu');
const lvlUpScreen = document.getElementById('level-up-screen');
const gameOverScreen = document.getElementById('game-over');
const lvlNumEl = document.getElementById('lvl-num');
const buyBombBtn = document.getElementById('buy-bomb');

const MAX_LIMIT = 99999999;
let grid, heartScore = 0, currentLvl = 1, lvlProgress = 0, currentShapesData = [], isLocked = false;
let totalRecord = parseInt(localStorage.getItem('bb_total_record')) || 0;

const blocks = [
    { m: [[1, 1, 1]], c: 'c1' }, { m: [[1, 1]], c: 'c2' }, { m: [[1]], c: 'c3' },
    { m: [[1], [1]], c: 'c2' }, { m: [[1], [1], [1]], c: 'c1' },
    { m: [[1, 1], [1, 1]], c: 'c4' }, { m: [[1, 0], [1, 1]], c: 'c5' },
    { m: [[1, 1], [0, 1]], c: 'c5' }, { m: [[0, 1], [1, 1]], c: 'c5' },
    { m: [[0, 1], [0, 1], [1, 1]], c: 'c1' },
    { m: [[1, 1, 1], [0, 1, 0]], c: 'c3' }, { m: [[1, 1, 1], [0, 0, 1]], c: 'c2' }
];

// --- ВСПЫШКА ---
const flashDiv = document.createElement('div');
flashDiv.className = 'flash-effect';
document.body.appendChild(flashDiv);

// --- СОХРАНЕНИЕ И ЗАГРУЗКА ---
function saveGameState() {
    const gameState = { grid, heartScore, currentLvl, lvlProgress, currentShapesData };
    localStorage.setItem('bb_game_save', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('bb_game_save');
    if (saved) {
        const data = JSON.parse(saved);
        grid = data.grid; heartScore = data.heartScore;
        currentLvl = data.currentLvl; lvlProgress = data.lvlProgress;
        currentShapesData = data.currentShapesData;
        renderGridFromMemory(); renderDock(); updateUI();
        return true;
    }
    return false;
}

function renderGridFromMemory() {
    gridContainer.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            const color = grid[r][c];
            cell.className = 'cell' + (color ? ' filled ' + color : '');
            cell.id = `cell-${r}-${c}`;
            gridContainer.appendChild(cell);
        }
    }
}
// --- МИРОВОЙ РЕЙТИНГ ---
function initFakeLeaderboard() {
    if (!localStorage.getItem('fake_leaderboard')) {
        let fakeData = [{ name: "KING_", score: 50000 }, { name: "Shadow_Pro", score: 35500 }, { name: "Legendary", score: 21200 }, { name: "MegaMind", score: 10500 }];
        localStorage.setItem('fake_leaderboard', JSON.stringify(fakeData));
    }
}

window.showLeaderboard = function() {
    const listEl = document.getElementById('leaderboard-list');
    let board = JSON.parse(localStorage.getItem('fake_leaderboard'));
    board = board.map(player => {
        player.score += Math.floor(Math.random() * 90) + 10;
        return player;
    });
    localStorage.setItem('fake_leaderboard', JSON.stringify(board));
    let fullList = [...board, { name: "ТЫ (ВЫ)", score: totalRecord, isPlayer: true }].sort((a, b) => b.score - a.score);
    listEl.innerHTML = fullList.slice(0, 5).map((item, index) => {
        let style = item.isPlayer ? "color:#00f2ff;font-weight:bold;" : "";
        return `<div style="display:flex;justify-content:space-between;margin-bottom:15px;${style}"><span>${index + 1}. ${item.name}</span><span>${item.score.toLocaleString()}</span></div>`;
    }).join('');
    document.getElementById('leaderboard-screen').classList.remove('hidden');
};

window.closeLeaderboard = () => document.getElementById('leaderboard-screen').classList.add('hidden');

// --- ИГРОВАЯ ЛОГИКА ---
window.pressPlay = function() {
    startMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (!loadGameState()) resetFullGame();
};

// Функция ПЕРЕЗАПУСКА (Сначала)
window.resetFullGame = function() {
    localStorage.removeItem('bb_game_save');
    heartScore = 0; currentLvl = 1; lvlProgress = 0; isLocked = false;
    gameOverScreen.classList.add('hidden');
    initGrid(); spawnNewSet(); updateUI();
};

function initGrid() {
    grid = Array.from({length: 8}, () => Array(8).fill(null));
    gridContainer.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell'; cell.id = `cell-${r}-${c}`;
            gridContainer.appendChild(cell);
        }
    }
}

function spawnNewSet() {
    currentShapesData = [];
    let indices = [...Array(blocks.length).keys()];
    for(let i = 0; i < 3; i++) {
        let rand = Math.floor(Math.random() * indices.length);
        currentShapesData.push(JSON.parse(JSON.stringify({...blocks[indices[rand]], id: Math.random()})));
        indices.splice(rand, 1);
    }
    renderDock();
    saveGameState();
}

function renderDock() {
    shapesDock.innerHTML = '';
    currentShapesData.forEach((shape, index) => {
        if (!shape) return;
        const container = document.createElement('div');
        container.className = 'shape-preview';
        container.id = `shape-container-${index}`;
        const inner = document.createElement('div');
        inner.className = 'shape-inner';
        inner.style.gridTemplateColumns = `repeat(${shape.m[0].length}, 35px)`;
        shape.m.forEach(row => row.forEach(val => {
            const b = document.createElement('div');
            b.style.width = '35px'; b.style.height = '35px';
            if (val) b.className = (shape.isBomb ? 'bomb-unit' : 'cell filled ' + shape.c);
            else b.style.visibility = 'hidden';
            inner.appendChild(b);
        }));
        container.onpointerdown = (e) => { if(!isLocked) startDrag(e, shape, index); };
        container.appendChild(inner);
        shapesDock.appendChild(container);
    });
    checkGameOver();
}

function startDrag(e, shape, idx) {
    const cellSize = gridContainer.offsetWidth / 8;
    const originalShape = document.getElementById(`shape-container-${idx}`);
    if (originalShape) originalShape.style.opacity = "0.3";

    dragGhost.innerHTML = '';
    dragGhost.style.gridTemplateColumns = `repeat(${shape.m[0].length}, ${cellSize}px)`;
    shape.m.forEach(row => row.forEach(val => {
        const b = document.createElement('div');
        b.style.width = cellSize + 'px'; b.style.height = cellSize + 'px';
        if (val) b.className = (shape.isBomb ? 'bomb-unit' : 'cell filled ' + shape.c);
        dragGhost.appendChild(b);
    }));
    dragGhost.classList.remove('hidden');
    
    const move = (me) => {
        const t = me.touches ? me.touches[0] : me;
        dragGhost.style.left = (t.clientX - (cellSize * shape.m[0].length / 2)) + 'px';
        dragGhost.style.top = (t.clientY - (cellSize * shape.m.length) - 60) + 'px';
        const rect = gridContainer.getBoundingClientRect();
        const r = Math.round((t.clientY - (cellSize * shape.m.length) - 60 - rect.top) / cellSize);
        const c = Math.round((t.clientX - (cellSize * shape.m[0].length / 2) - rect.left) / cellSize);
        document.querySelectorAll('.cell').forEach(cl => cl.classList.remove('preview', 'bomb-glow'));
        if (r >= 0 && r <= 8 - shape.m.length && c >= 0 && c <= 8 - shape.m[0].length) {
            if (shape.isBomb) {
                for(let i=r-1; i<=r+1; i++) for(let j=c-1; j<=c+1; j++) document.getElementById(`cell-${i}-${j}`)?.classList.add('bomb-glow');
            } else if (canPlace(shape.m, r, c)) {
                for(let i=0; i<shape.m.length; i++) for(let j=0; j<shape.m[i].length; j++)
                    if(shape.m[i][j]) document.getElementById(`cell-${r+i}-${c+j}`)?.classList.add('preview');
            }
        }
    };

    const end = (me) => {
        document.removeEventListener('pointermove', move); 
        document.removeEventListener('pointerup', end);
        dragGhost.classList.add('hidden');
        const t = me.changedTouches ? me.changedTouches[0] : me;
        const rect = gridContainer.getBoundingClientRect();
        const r = Math.round((t.clientY - (cellSize * shape.m.length) - 60 - rect.top) / cellSize);
        const c = Math.round((t.clientX - (cellSize * shape.m[0].length / 2) - rect.left) / cellSize);
        let placed = false;
        if (r >= 0 && r <= 8 - shape.m.length && c >= 0 && c <= 8 - shape.m[0].length) {
            if (shape.isBomb) { explode(r, c); currentShapesData[idx] = null; placed = true; finalizeTurn(); }
            else if (canPlace(shape.m, r, c)) {
                shape.m.forEach((row, i) => row.forEach((v, j) => {
                    if(v) { grid[r+i][c+j] = shape.c; updateCell(r+i, c+j, shape.c); }
                }));
                currentShapesData[idx] = null; placed = true; finalizeTurn();
            }
        }
        if (!placed && originalShape) originalShape.style.opacity = "1";
    };
    document.addEventListener('pointermove', move); 
    document.addEventListener('pointerup', end);
}

function canPlace(m, r, c) {
    return m.every((row, i) => row.every((v, j) => !v || (grid[r+i] && grid[r+i][c+j] === null)));
}

function finalizeTurn() {
    checkLines();
    if (currentShapesData.every(s => s === null)) { lvlProgress += 10; spawnNewSet(); }
    else { renderDock(); saveGameState(); }
    
    if (lvlProgress >= 100) { 
        isLocked = true;
        flashDiv.classList.add('flash-active');
        setTimeout(() => flashDiv.classList.remove('flash-active'), 600);
        lvlUpScreen.innerHTML = `<h1>LEVEL UP!</h1><div class="level-sub-text">LEVEL ${currentLvl + 1}</div>`;
        lvlUpScreen.classList.remove('hidden');
        setTimeout(() => {
            lvlUpScreen.classList.add('hidden');
            lvlProgress = 0; currentLvl++; initGrid(); isLocked = false; updateUI(); spawnNewSet();
        }, 2000);
    }
    updateUI();
}

function checkLines() {
    let rs = [], cs = [];
    for (let i = 0; i < 8; i++) {
        if (grid[i].every(v => v !== null)) rs.push(i);
        if (grid.every(row => row[i] !== null)) cs.push(i);
    }
    if (rs.length > 0 || cs.length > 0) {
        rs.forEach(r => { for(let c=0; c<8; c++) { animateCell(r, c); grid[r][c] = null; } heartScore += 100; });
        cs.forEach(c => { for(let r=0; r<8; r++) { if (grid[r][c] !== null) { animateCell(r, c); grid[r][c] = null; } } heartScore += 50; });
        totalRecord += (rs.length + cs.length) * 50;
        updateUI(); 
    }
}

function animateCell(r, c) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (cell) {
        cell.classList.add('cell-exploding');
        setTimeout(() => { cell.classList.remove('cell-exploding'); updateCell(r, c, null); }, 300);
    }
}

function explode(r, c) {
    for(let i=r-1; i<=r+1; i++) for(let j=c-1; j<=c+1; j++) {
        if(i>=0 && i<8 && j>=0 && j<8 && grid[i][j]) { grid[i][j] = null; updateCell(i, j, null); heartScore += 5; totalRecord += 5; }
    }
    saveGameState();
}

function updateUI() {
    if (totalRecord > MAX_LIMIT) totalRecord = MAX_LIMIT;
    if (heartScore > MAX_LIMIT) heartScore = MAX_LIMIT;
    const scoreStr = heartScore.toString();
    scoreHeartEl.style.fontSize = scoreStr.length <= 4 ? "24px" : scoreStr.length <= 6 ? "18px" : "14px";
    scoreHeartEl.innerText = heartScore;
    bestEl.innerText = totalRecord.toLocaleString();
    progressEl.style.width = Math.min(lvlProgress, 100) + "%";
    lvlNumEl.innerText = currentLvl;
    buyBombBtn.disabled = (heartScore < 150);
    saveGameState();
}

function updateCell(r, c, col) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if(cell) cell.className = 'cell ' + (col ? 'filled ' + col : '');
    if (col) bumpHeart(); 
}

function bumpHeart() {
    const wrapper = document.querySelector('.neon-heart-wrapper');
    if (wrapper) {
        wrapper.classList.remove('heart-bump');
        void wrapper.offsetWidth; 
        wrapper.classList.add('heart-bump');
    }
}

function checkGameOver() {
    let hasMove = currentShapesData.some(s => {
        if(!s) return false; if(s.isBomb) return true;
        for(let r=0; r<=8-s.m.length; r++) for(let c=0; c<=8-s.m[0].length; c++) if(canPlace(s.m, r, c)) return true;
        return false;
    });
    if(!hasMove && heartScore < 150 && currentShapesData.some(s => s !== null)) {
        isLocked = true;
        setTimeout(() => {
            gameOverScreen.classList.remove('hidden');
        }, 1500);
    }
}

window.buyPower = function() {
    if (heartScore < 150) return;
    let targetIndex = currentShapesData.findIndex(s => s === null || !s.isBomb);
    if (targetIndex === -1) return;
    heartScore -= 150;
    currentShapesData[targetIndex] = { n: 'bomb', m: [[1]], isBomb: true, id: Math.random() };
    renderDock(); updateUI(); saveGameState();
};

// Привязываем кнопку "СНАЧАЛА" (из картинки)
document.addEventListener('pointerdown', (e) => {
    if (e.target.innerText === 'СНАЧАЛА' || e.target.closest('.restart-btn')) {
        resetFullGame();
    }
});

bestEl.innerText = totalRecord.toLocaleString();
