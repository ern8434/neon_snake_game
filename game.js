// Game Configuration
const CONFIG = {
    gridSize: 20,
    initialSpeed: 250,
    speedIncrease: 10,
    minSpeed: 100,
    colors: {
        snake: '#00f0ff',
        snakeGlow: 'rgba(0, 240, 255, 0.8)',
        food: '#ff00ff',
        foodGlow: 'rgba(255, 0, 255, 0.8)',
        grid: 'rgba(157, 0, 255, 0.1)'
    }
};

// Game State
let canvas, ctx;
let snake = [];
let direction = { x: -1, y: 0 };
let nextDirection = { x: -1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let bestScore = 0;
let gameLoop = null;
let speed = CONFIG.initialSpeed;
let isGameOver = false;
let isGameStarted = false;

// DOM Elements
const gameOverScreen = document.getElementById('game-over-screen');
const startScreen = document.getElementById('start-screen');
const currentScoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Initialize Game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size for mobile
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load best score from localStorage
    bestScore = parseInt(localStorage.getItem('neonSnakeBestScore')) || 0;
    bestScoreEl.textContent = bestScore;

    // Show start screen
    startScreen.classList.add('active');

    // Event Listeners
    setupControls();

    // Start game on tap
    startScreen.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Make canvas square and fit container
    const size = Math.min(containerWidth, containerHeight);
    canvas.width = size;
    canvas.height = size;

    // Redraw if game is running
    if (isGameStarted && !isGameOver) {
        draw();
    }
}

function setupControls() {
    // Button controls
    document.getElementById('btn-up').addEventListener('click', () => changeDirection('up'));
    document.getElementById('btn-down').addEventListener('click', () => changeDirection('down'));
    document.getElementById('btn-left').addEventListener('click', () => changeDirection('left'));
    document.getElementById('btn-right').addEventListener('click', () => changeDirection('right'));

    // Keyboard controls (for testing)
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp': changeDirection('up'); break;
            case 'ArrowDown': changeDirection('down'); break;
            case 'ArrowLeft': changeDirection('left'); break;
            case 'ArrowRight': changeDirection('right'); break;
        }
    });

    // Touch swipe controls
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                changeDirection(deltaX > 0 ? 'right' : 'left');
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                changeDirection(deltaY > 0 ? 'down' : 'up');
            }
        }
    });
}

function changeDirection(newDir) {
    if (!isGameStarted || isGameOver) return;

    const dirMap = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 }
    };

    const newDirection = dirMap[newDir];

    // Prevent reversing into itself
    if (newDirection.x === -direction.x || newDirection.y === -direction.y) {
        return;
    }

    nextDirection = newDirection;
}

function startGame() {
    startScreen.classList.remove('active');
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    speed = CONFIG.initialSpeed;
    direction = { x: -1, y: 0 };
    nextDirection = { x: -1, y: 0 };

    // Initialize snake in the middle
    const centerX = Math.floor(CONFIG.gridSize / 2);
    const centerY = Math.floor(CONFIG.gridSize / 2);
    snake = [
        { x: centerX, y: centerY },
        { x: centerX + 1, y: centerY },
        { x: centerX + 2, y: centerY }
    ];

    spawnFood();
    updateScore();
    draw();

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
}

function restartGame() {
    gameOverScreen.classList.remove('active');
    startGame();
}

function spawnFood() {
    let newFood;
    let isOnSnake;

    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * CONFIG.gridSize),
            y: Math.floor(Math.random() * CONFIG.gridSize)
        };

        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);

    food = newFood;
}

function update() {
    if (isGameOver) return;

    // Update direction
    direction = { ...nextDirection };

    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= CONFIG.gridSize || head.y < 0 || head.y >= CONFIG.gridSize) {
        endGame();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();

        // Increase speed
        if (speed > CONFIG.minSpeed) {
            speed = Math.max(CONFIG.minSpeed, speed - CONFIG.speedIncrease);
            clearInterval(gameLoop);
            gameLoop = setInterval(update, speed);
        }
    } else {
        // Remove tail
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 0, 21, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw food with glow
    drawFood();

    // Draw snake with glow
    drawSnake();
}

function drawGrid() {
    const cellSize = canvas.width / CONFIG.gridSize;
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= CONFIG.gridSize; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

function drawSnake() {
    const cellSize = canvas.width / CONFIG.gridSize;

    snake.forEach((segment, index) => {
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = CONFIG.colors.snakeGlow;

        // Snake body
        ctx.fillStyle = CONFIG.colors.snake;
        const padding = 2;
        const radius = 6;

        ctx.beginPath();
        ctx.roundRect(
            x + padding,
            y + padding,
            cellSize - padding * 2,
            cellSize - padding * 2,
            radius
        );
        ctx.fill();

        // Head highlight
        if (index === 0) {
            ctx.shadowBlur = 30;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(
                x + padding + 2,
                y + padding + 2,
                cellSize - padding * 2 - 4,
                cellSize - padding * 2 - 4,
                radius - 2
            );
            ctx.fill();
        }
    });

    // Reset shadow
    ctx.shadowBlur = 0;
}

function drawFood() {
    const cellSize = canvas.width / CONFIG.gridSize;
    const x = food.x * cellSize + cellSize / 2;
    const y = food.y * cellSize + cellSize / 2;
    const radius = cellSize / 3;

    // Outer glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = CONFIG.colors.foodGlow;

    // Food orb
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, CONFIG.colors.food);
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing effect
    const pulseRadius = radius * 1.5 + Math.sin(Date.now() / 200) * 5;
    ctx.strokeStyle = CONFIG.colors.food;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Reset
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function updateScore() {
    currentScoreEl.textContent = score;

    if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem('neonSnakeBestScore', bestScore);
    }
}

function endGame() {
    isGameOver = true;
    clearInterval(gameLoop);

    finalScoreEl.textContent = score;
    gameOverScreen.classList.add('active');
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        return this;
    };
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
