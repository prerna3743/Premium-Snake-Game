const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Mobile Controls
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

// Game Constants
const TILE_COUNT = 30;
const TILE_SIZE = canvas.width / TILE_COUNT;
const POINTS_PER_FOOD = 10;
const LEVEL_UP_SCORE = 50; // Level up every 50 points

// Game State
let snake = [];
let velocity = { x: 0, y: 0 };
let nextVelocity = { x: 0, y: 0 };
let food = { x: 15, y: 15 };
let obstacles = [];
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let currentLevel = 1;
let gameLoopTimeout;
let gameState = 'START'; // START, PLAYING, GAMEOVER

highScoreElement.textContent = highScore;

// Level configurations
const levels = {
    1: {
        speed: 120, // ms per frame
        snakeColor: '#00f2fe',
        foodColor: '#ff0844',
        shape: 'square',
        setup: () => { obstacles = []; }
    },
    2: {
        speed: 90,
        snakeColor: '#43e97b',
        foodColor: '#f83600',
        shape: 'rounded',
        setup: () => {
            obstacles = [];
            // Add simple walls
            for(let i=5; i<25; i++) {
                obstacles.push({x: i, y: 5});
                obstacles.push({x: i, y: 24});
            }
        }
    },
    3: {
        speed: 70,
        snakeColor: '#f6d365',
        foodColor: '#a18cd1',
        shape: 'circle',
        setup: () => {
            obstacles = [];
            // Add complex walls (Cross)
            for(let i=5; i<25; i++) {
                if(i !== 14 && i !== 15) {
                    obstacles.push({x: i, y: 14});
                    obstacles.push({x: i, y: 15});
                    obstacles.push({x: 14, y: i});
                    obstacles.push({x: 15, y: i});
                }
            }
        }
    }
};

function initGame() {
    snake = [
        { x: 15, y: 15 },
        { x: 15, y: 16 },
        { x: 15, y: 17 }
    ];
    velocity = { x: 0, y: -1 };
    nextVelocity = { x: 0, y: -1 };
    score = 0;
    currentLevel = 1;
    scoreElement.textContent = score;
    updateLevelUI();
    placeFood();
    levels[currentLevel].setup();
}

function startGame() {
    initGame();
    gameState = 'PLAYING';
    overlay.classList.add('hidden');
    startBtn.style.display = 'none';
    restartBtn.style.display = 'block';
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    overlayTitle.textContent = 'Game Over';
    overlayTitle.style.background = 'linear-gradient(to right, #ff0844, #ffb199)';
    overlayTitle.style.webkitBackgroundClip = 'text';
    
    overlayMessage.textContent = `You reached Level ${currentLevel} with ${score} points!`;
    overlay.classList.remove('hidden');
}

function updateLevel() {
    const newLevel = Math.min(3, Math.floor(score / LEVEL_UP_SCORE) + 1);
    if (newLevel !== currentLevel) {
        currentLevel = newLevel;
        updateLevelUI();
        levels[currentLevel].setup();
        // Visual effect for level up
        canvas.style.transform = 'scale(1.05)';
        setTimeout(() => canvas.style.transform = 'scale(1)', 200);
    }
}

function updateLevelUI() {
    levelElement.textContent = currentLevel;
    document.body.className = `level-${currentLevel}`;
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    update();
    draw();

    if (gameState === 'PLAYING') {
        gameLoopTimeout = setTimeout(gameLoop, levels[currentLevel].speed);
    }
}

function update() {
    velocity = { ...nextVelocity };

    // Calculate new head position
    const head = { 
        x: snake[0].x + velocity.x, 
        y: snake[0].y + velocity.y 
    };

    // 1. Check Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // 2. Check Obstacle Collision
    for (let obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) {
            gameOver();
            return;
        }
    }

    // 3. Check Self Collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Move snake
    snake.unshift(head);

    // 4. Check Food Collision
    if (head.x === food.x && head.y === food.y) {
        score += POINTS_PER_FOOD;
        scoreElement.textContent = score;
        updateLevel();
        placeFood();
    } else {
        snake.pop(); // Remove tail if no food eaten
    }
}

function placeFood() {
    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        
        validPosition = true;
        // Check snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) validPosition = false;
        }
        // Check obstacles
        for (let obs of obstacles) {
            if (obs.x === food.x && obs.y === food.y) validPosition = false;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Optional, subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for(let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE, 0);
        ctx.lineTo(i * TILE_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * TILE_SIZE);
        ctx.lineTo(canvas.width, i * TILE_SIZE);
        ctx.stroke();
    }

    const config = levels[currentLevel];

    // Draw Obstacles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x * TILE_SIZE, obs.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // Draw Food
    ctx.fillStyle = config.foodColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = config.foodColor;
    drawShape(food.x, food.y, config.shape, true);
    ctx.shadowBlur = 0; // Reset shadow

    // Draw Snake
    snake.forEach((segment, index) => {
        // Head is slightly brighter or different
        if (index === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            // Gradient effect along snake body
            ctx.fillStyle = config.snakeColor;
            ctx.globalAlpha = 1 - (index / snake.length) * 0.5; // Fade to tail
        }
        
        drawShape(segment.x, segment.y, config.shape, false);
        ctx.globalAlpha = 1.0;
    });
}

function drawShape(x, y, shape, isFood) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const size = isFood ? TILE_SIZE - 4 : TILE_SIZE - 1; // Food slightly smaller, snake slightly gapped
    const offset = isFood ? 2 : 0.5;

    ctx.beginPath();
    if (shape === 'square') {
        ctx.rect(px + offset, py + offset, size, size);
    } else if (shape === 'rounded') {
        ctx.roundRect(px + offset, py + offset, size, size, 5);
    } else if (shape === 'circle') {
        ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, size/2, 0, Math.PI * 2);
    }
    ctx.fill();
}

// Input Handling
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (velocity.y === 1) return;
            nextVelocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (velocity.y === -1) return;
            nextVelocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (velocity.x === 1) return;
            nextVelocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (velocity.x === -1) return;
            nextVelocity = { x: 1, y: 0 };
            break;
    }
});

// Mobile button listeners
btnUp.addEventListener('click', () => { if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 }; });
btnDown.addEventListener('click', () => { if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 }; });
btnLeft.addEventListener('click', () => { if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 }; });
btnRight.addEventListener('click', () => { if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 }; });

// Prevent default scrolling on touch for buttons
const preventScroll = (e) => { e.preventDefault(); };
btnUp.addEventListener('touchstart', preventScroll, {passive: false});
btnDown.addEventListener('touchstart', preventScroll, {passive: false});
btnLeft.addEventListener('touchstart', preventScroll, {passive: false});
btnRight.addEventListener('touchstart', preventScroll, {passive: false});


startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw to show grid
draw();
