const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreVal = document.getElementById('scoreVal');
const finalScoreVal = document.getElementById('finalScoreVal');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

let gameState = 'START';
let score = 0;
let animationId;
let cameraY = 0;

const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.reset();
    }
    reset() {
        this.x = width / 2 - this.width / 2;
        this.y = height / 2;
        this.vy = 0;
        this.vx = 0;
        
        // Floatier physics
        this.gravity = 0.15; // Low gravity
        this.jumpForce = -8; // Gentle jump
        this.moveAccel = 0.3; // Slippery moving
        this.friction = 0.95; // Inertia
        this.maxSpeed = 6;
    }

    update() {
        // Move horizontally
        if (keys.ArrowLeft || keys.a) this.vx -= this.moveAccel;
        if (keys.ArrowRight || keys.d) this.vx += this.moveAccel;

        // Apply friction & max speed
        this.vx *= this.friction;
        if (Math.abs(this.vx) > this.maxSpeed) {
            this.vx = (this.vx > 0 ? 1 : -1) * this.maxSpeed;
        }

        // Apply gravity
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap horizontally
        if (this.x + this.width < 0) this.x = width;
        if (this.x > width) this.x = -this.width;

    }

    jump() {
        this.vy = this.jumpForce;
    }

    draw() {
        ctx.fillStyle = '#ff00c8';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00c8';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 0; // reset
    }
}

class Platform {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = 15;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Neon top rim
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(this.x, this.y, this.width, 3);
    }
}

const player = new Player();
let platforms = [];

function generatePlatforms(startY, num) {
    for (let i = 0; i < num; i++) {
        let w = Math.random() * 80 + 60;
        let x = Math.random() * (width - w);
        let y = startY - i * 120; // 120px gap vertically
        platforms.push(new Platform(x, y, w));
    }
}

function initGame() {
    player.reset();
    platforms = [];
    cameraY = 0;
    score = 0;
    scoreVal.innerText = score;
    
    // Starting platform
    platforms.push(new Platform(width/2 - 75, height - 50, 150));
    generatePlatforms(height - 150, 20);

    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScoreVal.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function checkCollisions() {
    // Only collide if falling down
    if (player.vy > 0) {
        for (let p of platforms) {
            // Check if player bottom is crossing the platform top
            if (player.y + player.height >= p.y &&
                player.y + player.height <= p.y + p.height + player.vy &&
                player.x + player.width > p.x &&
                player.x < p.x + p.width) {
                
                // Adjust position
                player.y = p.y - player.height;
                player.jump();
            }
        }
    }
}

function updateCamera() {
    // If player goes above middle of screen, move camera up (which shifts everything down)
    const midScreen = height / 2;
    if (player.y < midScreen) {
        const diff = midScreen - player.y;
        player.y += diff;
        cameraY += diff;
        
        // Update score based on camera
        if (Math.floor(cameraY/10) > score) {
            score = Math.floor(cameraY/10);
            scoreVal.innerText = score;
        }

        // Shift platforms down
        platforms.forEach(p => p.y += diff);
    }
    
    // Remove old platforms, generate new ones
    platforms = platforms.filter(p => p.y < height + 100);
    
    if (platforms.length < 15) {
        let highestY = Math.min(...platforms.map(p => p.y));
        generatePlatforms(highestY - 120, 10);
    }
}

// Stars background
const stars = Array.from({length: 100}).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2
}));

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(s => {
        // Move stars slower than the camera for parallax
        let displayY = (s.y + cameraY * 0.1) % height;
        if (displayY < 0) displayY += height;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(s.x, displayY, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;
}


function animate() {
    if (gameState !== 'PLAYING') return;

    ctx.fillStyle = 'rgba(5, 5, 8, 1)';
    ctx.fillRect(0, 0, width, height);

    drawStars();

    player.update();
    checkCollisions();
    updateCamera();

    // Check game over (fall off screen)
    if (player.y > height) {
        endGame();
        return;
    }

    platforms.forEach(p => p.draw());
    player.draw();

    animationId = requestAnimationFrame(animate);
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

function idleAnimation() {
    if (gameState === 'PLAYING') return;
    ctx.fillStyle = 'rgba(5, 5, 8, 1)';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    requestAnimationFrame(idleAnimation);
}

idleAnimation();
