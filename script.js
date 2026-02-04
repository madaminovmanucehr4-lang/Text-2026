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

// --- МИРОВОЙ РЕЙТИНГ ---
function initFakeLeaderboard() {
    // Чтобы сбросить старые миллионы ботов, один раз убери // перед строкой ниже:
    // localStorage.removeItem('fake_leaderboard');

    if (!localStorage.getItem('fake_leaderboard')) {
        let fakeData = [
            { name: "KING_", score: 50000 }, 
            { name: "Shadow_Pro", score: 35500 },
            { name: "Legendary", score: 21200 },
            { name: "MegaMind", score: 10500 }
        ];
        localStorage.setItem('fake_leaderboard', JSON.stringify(fakeData));
    }
}

window.showLeaderboard = function() {
    const listEl = document.getElementById('leaderboard-list');
    let board = JSON.parse(localStorage.getItem('fake_leaderboard'));
    
    // ЭФФЕКТ РОСТА: боты прибавляют очки при каждом клике на кубок
    board = board.map(player => {
        let bonus = Math.floor(Math.random() * 90) + 10; 
        player.score += bonus;
        if (player.score > MAX_LIMIT) player.score = MAX_LIMIT;
        return player;
    });
    localStorage.setItem('fake_leaderboard', JSON.stringify(board));

    let fullList = [...board, { name: "ТЫ (ВЫ)", score: totalRecord, isPlayer: true }];
    fullList.sort((a, b) => b.score - a.score);
    
    listEl.innerHTML = fullList.slice(0, 5).map((item, index) => {
        let style = index === 0 ? "color:#fbff00;text-shadow:0 0 10px gold;" : "";
        if (item.isPlayer) style = "color:#00f2ff;text-shadow:0 0 10px #00f2ff;font-weight:bold;";
        return `<div style="display:flex;justify-content:space-between;margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px;${style}">
                <span>${index + 1}. ${item.name}</span><span>${item.score.toLocaleString()}</span></div>`;
    }).join('');
    document.getElementById('leaderboard-screen').classList.remove('hidden');
};

window.closeLeaderboard = () => document.getElementById('leaderboard-screen').classList.add('hidden');

// --- ИГРОВАЯ ЛОГИКА ---
window.pressPlay = function() {
    startMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    resetFullGame();
};

function resetFullGame() {
    heartScore = 0; currentLvl = 1; lvlProgress = 0; isLocked = false;
    initGrid(); spawnNewSet(); updateUI();
}

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
}

function renderDock() {
    shapesDock.innerHTML = '';
    currentShapesData.forEach((shape, index) => {
        if (!shape) return;
        const container = document.createElement('div');
        container.className = 'shape-preview';
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
        dragGhost.style.top = (t.clientY - (cellSize * shape.m.length) - 50) + 'px';
        const rect = gridContainer.getBoundingClientRect();
        const r = Math.round((t.clientY - (cellSize * shape.m.length) - 50 - rect.top) / cellSize);
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
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end);
        dragGhost.classList.add('hidden');
        const t = me.changedTouches ? me.changedTouches[0] : me;
        const rect = gridContainer.getBoundingClientRect();
        const r = Math.round((t.clientY - (cellSize * shape.m.length) - 50 - rect.top) / cellSize);
        const c = Math.round((t.clientX - (cellSize * shape.m[0].length / 2) - rect.left) / cellSize);
        if (r >= 0 && r <= 8 - shape.m.length && c >= 0 && c <= 8 - shape.m[0].length) {
            if (shape.isBomb) { explode(r, c); currentShapesData[idx] = null; finalizeTurn(); }
            else if (canPlace(shape.m, r, c)) {
                shape.m.forEach((row, i) => row.forEach((v, j) => {
                    if(v) { grid[r+i][c+j] = shape.c; updateCell(r+i, c+j, shape.c); }
                }));
                currentShapesData[idx] = null; finalizeTurn();
            } else renderDock();
        } else renderDock();
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end);
}

function canPlace(m, r, c) {
    return m.every((row, i) => row.every((v, j) => !v || (grid[r+i] && grid[r+i][c+j] === null)));
}

function finalizeTurn() {
    checkLines();
    if (currentShapesData.every(s => s === null)) { lvlProgress += 10; spawnNewSet(); }
    else renderDock();
    if (lvlProgress >= 100) { 
        isLocked = true;
        document.querySelectorAll('.cell').forEach(cell => { cell.style.backgroundColor = "white"; cell.style.boxShadow = "0 0 20px white"; });
        lvlUpScreen.classList.remove('hidden');
        setTimeout(() => {
            lvlUpScreen.classList.add('hidden');
            lvlProgress = 0; currentLvl++; initGrid(); isLocked = false; updateUI(); spawnNewSet();
        }, 1200);
    }
    updateUI();
}

function checkLines() {
    let rs = [], cs = [];
    for (let i = 0; i < 8; i++) {
        if (grid[i].every(v => v !== null)) rs.push(i);
        if (grid.every(row => row[i] !== null)) cs.push(i);
    }
    rs.forEach(r => { 
        grid[r].fill(null); for(let c=0; c<8; c++) updateCell(r, c, null); 
        heartScore += 50; totalRecord += 50; lvlProgress += 14; 
    });
    cs.forEach(c => { 
        for(let r=0; r<8; r++) { grid[r][c] = null; updateCell(r, c, null); } 
        heartScore += 50; totalRecord += 50; lvlProgress += 14; 
    });
}

function explode(r, c) {
    for(let i=r-1; i<=r+1; i++) for(let j=c-1; j<=c+1; j++) {
        if(i>=0 && i<8 && j>=0 && j<8 && grid[i][j]) { grid[i][j] = null; updateCell(i, j, null); heartScore += 5; totalRecord += 5; }
    }
}

function updateUI() {
    if (totalRecord > MAX_LIMIT) totalRecord = MAX_LIMIT;
    if (heartScore > MAX_LIMIT) heartScore = MAX_LIMIT;
    scoreHeartEl.innerText = heartScore;
    bestEl.innerText = totalRecord.toLocaleString();
    localStorage.setItem('bb_total_record', totalRecord);
    progressEl.style.width = Math.min(lvlProgress, 100) + "%";
    lvlNumEl.innerText = currentLvl;
    buyBombBtn.disabled = (heartScore < 150);
}

function updateCell(r, c, col) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if(cell) cell.className = 'cell ' + (col ? 'filled ' + col : '');
}

function checkGameOver() {
    let hasMove = currentShapesData.some(s => {
        if(!s) return false; if(s.isBomb) return true;
        for(let r=0; r<=8-s.m.length; r++) for(let c=0; c<=8-s.m[0].length; c++) if(canPlace(s.m, r, c)) return true;
        return false;
    });
    if(!hasMove && heartScore < 150 && currentShapesData.some(s => s !== null)) {
        isLocked = true;
        document.querySelectorAll('.cell').forEach(cell => { cell.style.backgroundColor = "#550000"; cell.style.boxShadow = "0 0 15px red"; });
        setTimeout(() => gameOverScreen.classList.remove('hidden'), 2000);
    }
}

window.buyPower = function() {
    if (heartScore >= 150) { heartScore -= 150; updateUI(); currentShapesData[0] = { n: 'bomb', m: [[1]], isBomb: true }; renderDock(); }
};

initFakeLeaderboard();
bestEl.innerText = totalRecord.toLocaleString();
