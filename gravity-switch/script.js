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
let gameSpeed = 5;

// Physics
let gravityDir = 1; // 1 = down, -1 = up
let gravityMagnitude = 0.8;

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
        this.x = 100;
        this.y = height / 2;
        this.vy = 0;
        gravityDir = 1;
    }
    switchGravity() {
        gravityDir *= -1;
    }
    update() {
        this.vy += gravityMagnitude * gravityDir;
        this.y += this.vy;

        // Floor and ceiling collisions
        // We leave a 50px boundary for the neon floor/ceiling
        if (this.y > height - 50 - this.height) {
            this.y = height - 50 - this.height;
            this.vy = 0;
        }
        if (this.y < 50) {
            this.y = 50;
            this.vy = 0;
        }
    }
    draw() {
        ctx.fillStyle = '#00ffaa';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffaa';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Obstacle {
    constructor(x) {
        this.x = x;
        this.width = 40;
        // The obstacle will spawn either on top or bottom
        this.isTop = Math.random() > 0.5;
        this.height = Math.random() * (height / 2 - 100) + 50; 
    }
    update() {
        this.x -= gameSpeed;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        
        if (this.isTop) {
            ctx.fillRect(this.x, 50, this.width, this.height);
        } else {
            ctx.fillRect(this.x, height - 50 - this.height, this.width, this.height);
        }
        ctx.shadowBlur = 0;
    }
}

const player = new Player();
let obstacles = [];
let particles = [];

function createParticle() {
    return {
        x: width,
        y: Math.random() * height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2 + 1
    };
}

function initGame() {
    player.reset();
    obstacles = [];
    particles = Array.from({length: 50}).map(() => ({...createParticle(), x: Math.random() * width}));
    score = 0;
    gameSpeed = 6;
    scoreVal.innerText = score;

    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScoreVal.innerText = Math.floor(score);
    gameOverScreen.classList.remove('hidden');
}

function checkCollisions() {
    for (let obs of obstacles) {
        let obsY = obs.isTop ? 50 : height - 50 - obs.height;
        
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obsY + obs.height &&
            player.y + player.height > obsY) {
            endGame();
            return;
        }
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'PLAYING') {
        player.switchGravity();
    }
});
window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        player.switchGravity();
    }
});

function animate() {
    if (gameState !== 'PLAYING') return;

    ctx.fillStyle = 'rgba(5, 5, 8, 1)';
    ctx.fillRect(0, 0, width, height);

    // Draw background particles (speed lines)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    particles.forEach(p => {
        p.x -= p.speed * (gameSpeed / 5);
        if (p.x < 0) {
            Object.assign(p, createParticle());
        }
        ctx.fillRect(p.x, p.y, p.size * 5, p.size); // Stretched for speed effect
    });

    // Draw floor and ceiling borders
    ctx.fillStyle = '#9d00ff';
    ctx.fillRect(0, 0, width, 50);
    ctx.fillRect(0, height - 50, width, 50);

    // Update and draw obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < width - 300 - Math.random() * 200) {
        obstacles.push(new Obstacle(width));
    }

    // Increase difficulty
    gameSpeed += 0.001;
    score += gameSpeed / 10;
    scoreVal.innerText = Math.floor(score);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].draw();
        if (obstacles[i].x < -100) {
            obstacles.splice(i, 1);
        }
    }

    player.update();
    player.draw();
    checkCollisions();

    animationId = requestAnimationFrame(animate);
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

function idleAnimation() {
    if (gameState === 'PLAYING') return;
    ctx.fillStyle = 'rgba(5, 5, 8, 1)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#9d00ff';
    ctx.fillRect(0, 0, width, 50);
    ctx.fillRect(0, height - 50, width, 50);

    requestAnimationFrame(idleAnimation);
}
idleAnimation();
