const board = document.getElementById("board");
const blocksDiv = document.getElementById("blocks");
const gameOver = document.getElementById("gameOver");

const SIZE = 8;
let grid = Array(SIZE * SIZE).fill(null);

for (let i = 0; i < SIZE * SIZE; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  board.appendChild(cell);
}

const SHAPES = [
  [[0,0],[1,0],[0,1],[1,1]],       // квадрат
  [[0,0],[1,0],[2,0]],             // линия
  [[0,0],[0,1],[1,1]],             // L
  [[1,0],[0,1],[1,1],[2,1]],       // T
  [[0,0],[1,0],[1,1]]              // Z
];

const COLORS = ["green","purple","yellow","blue"];

function createBlocks() {
  blocksDiv.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    const block = document.createElement("div");
    block.className = "block";
    block.dataset.shape = JSON.stringify(shape);
    block.dataset.color = color;

    const maxX = Math.max(...shape.map(p=>p[0]));
    const maxY = Math.max(...shape.map(p=>p[1]));
    block.style.gridTemplateColumns = `repeat(${maxX+1}, 1fr)`;

    shape.forEach(()=>{
      const d = document.createElement("div");
      d.className = color;
      block.appendChild(d);
    });

    enableDrag(block);
    blocksDiv.appendChild(block);
  }
}

function enableDrag(block) {
  let dragging = false;
  let startX = 0, startY = 0;

  block.addEventListener("pointerdown", e => {
    dragging = true;
    block.setPointerCapture(e.pointerId);

    const rect = block.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    block.style.position = "fixed";
    block.style.zIndex = 9999;
  });

  block.addEventListener("pointermove", e => {
    if (!dragging) return;

    block.style.left = e.clientX - startX + "px";
    block.style.top  = e.clientY - startY + "px";
  });

  block.addEventListener("pointerup", e => {
    dragging = false;
    block.releasePointerCapture(e.pointerId);

    const rect = board.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 42);
    const y = Math.floor((e.clientY - rect.top) / 42);

    if (canPlace(block, x, y)) {
      placeBlock(block, x, y);
      block.remove();
      clearLines();
      createBlocks(); // ← НОВЫЕ БЛОКИ ГАРАНТИРОВАННО
      checkGameOver();
    } else {
      // вернуть вниз
      block.style.position = "static";
      block.style.left = "";
      block.style.top = "";
      blocksDiv.appendChild(block);
    }
  });
}

function canPlace(block, x, y) {
  const shape = JSON.parse(block.dataset.shape);
  return shape.every(([dx,dy])=>{
    const nx = x + dx;
    const ny = y + dy;
    return nx>=0 && ny>=0 && nx<SIZE && ny<SIZE && !grid[ny*SIZE+nx];
  });
}

function placeBlock(block, x, y) {
  const shape = JSON.parse(block.dataset.shape);
  const color = block.dataset.color;
  shape.forEach(([dx,dy])=>{
    const i = (y+dy)*SIZE+(x+dx);
    grid[i] = color;
    board.children[i].classList.add("filled", color);
  });
}

function clearLines() {
  for (let i=0;i<SIZE;i++){
    if ([...Array(SIZE).keys()].every(x=>grid[i*SIZE+x])){
      for(let x=0;x<SIZE;x++) clearCell(i*SIZE+x);
    }
    if ([...Array(SIZE).keys()].every(y=>grid[y*SIZE+i])){
      for(let y=0;y<SIZE;y++) clearCell(y*SIZE+i);
    }
  }
}

function clearCell(i){
  grid[i]=null;
  board.children[i].className="cell";
}

function checkGameOver(){
  const blocks=[...blocksDiv.children];
  const free = blocks.some(b=>{
    for(let y=0;y<SIZE;y++)
      for(let x=0;x<SIZE;x++)
        if (canPlace(b,x,y)) return true;
  });
  if(!free) gameOver.style.display="flex";
}

createBlocks();