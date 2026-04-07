const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
// Screens/UI
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreVal = document.getElementById('scoreVal');
const finalScoreVal = document.getElementById('finalScoreVal');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let frameCount = 0;
let animationId;

// Input handling
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false
};

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

// --- Game Objects ---

class Player {
    constructor() {
        this.radius = 15;
        this.reset();
    }

    reset() {
        this.x = width / 2;
        this.y = height / 2;
        this.vx = 0;
        this.vy = 0;
        // Zero gravity physics settings
        this.acceleration = 0.4;
        this.friction = 0.98; // Very high friction multiplier (low friction)
        this.maxSpeed = 8;
        this.angle = 0; // facing angle
    }

    update() {
        // Apply inputs - thrust
        let thrusting = false;
        
        if (keys.ArrowUp || keys.w) { this.vy -= this.acceleration; thrusting = true; }
        if (keys.ArrowDown || keys.s) { this.vy += this.acceleration; thrusting = true; }
        if (keys.ArrowLeft || keys.a) { this.vx -= this.acceleration; thrusting = true; }
        if (keys.ArrowRight || keys.d) { this.vx += this.acceleration; thrusting = true; }

        // Determine face angle if moving
        if (this.vx !== 0 || this.vy !== 0) {
            this.angle = Math.atan2(this.vy, this.vx);
        }

        // Apply max speed limit
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Apply friction (inertia)
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Position update
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap (zero gravity space doesn't have borders usually)
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        this.thrusting = thrusting;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // default points up, math assumes right

        // Draw Player Ship (neon triangle)
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.8, this.radius);
        ctx.lineTo(-this.radius * 0.8, this.radius);
        ctx.closePath();
        
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.fill();

        // Engine glow if thrusting
        if (this.thrusting) {
            ctx.beginPath();
            ctx.moveTo(0, this.radius + 15);
            ctx.lineTo(this.radius/2, this.radius);
            ctx.lineTo(-this.radius/2, this.radius);
            ctx.closePath();
            ctx.fillStyle = '#ff00c8';
            ctx.fill();
            
            // Add glow shadow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff00c8';
            ctx.fill();
        }

        ctx.restore();
    }
}

class Asteroid {
    constructor() {
        this.radius = Math.random() * 20 + 20;
        
        // Spawn off-screen
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { this.x = Math.random() * width; this.y = -this.radius; } // top
        else if (side === 1) { this.x = width + this.radius; this.y = Math.random() * height; } // right
        else if (side === 2) { this.x = Math.random() * width; this.y = height + this.radius; } // bottom
        else { this.x = -this.radius; this.y = Math.random() * height; } // left

        // Velocity towards center with some randomness
        const angleToCenter = Math.atan2(height/2 - this.y, width/2 - this.x);
        const randomAngle = angleToCenter + (Math.random() - 0.5);
        const speed = Math.random() * 2 + 1 + (score * 0.005); // increases difficulty slightly
        
        this.vx = Math.cos(randomAngle) * speed;
        this.vy = Math.sin(randomAngle) * speed;
        
        // Shape irregularities
        this.points = [];
        const numPoints = 8 + Math.floor(Math.random() * 6);
        for(let i=0; i<numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const dist = this.radius * (0.8 + Math.random() * 0.4);
            this.points.push({x: Math.cos(angle)*dist, y: Math.sin(angle)*dist});
        }
        
        this.rot = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rot += this.rotSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i=1; i<this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = '#9d00ff';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.stroke();
        ctx.fill();
        
        ctx.restore();
    }
    
    isOffScreen() {
        return (this.x < -this.radius*2 || this.x > width + this.radius*2 ||
                this.y < -this.radius*2 || this.y > height + this.radius*2);
    }
}

class StarField {
    constructor() {
        this.stars = [];
        for(let i=0; i<150; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5,
                alpha: Math.random()
            });
        }
    }
    draw() {
        ctx.fillStyle = 'white';
        this.stars.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

// Global Objects
const player = new Player();
let asteroids = [];
const starField = new StarField();

function spawnAsteroids() {
    // Spawn rate increases as score goes up
    const spawnRate = Math.max(10, 60 - Math.floor(score / 50));
    if (frameCount % spawnRate === 0) {
        asteroids.push(new Asteroid());
    }
}

function checkCollisions() {
    for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];
        // simple circle collision
        const dx = player.x - a.x;
        const dy = player.y - a.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < player.radius + a.radius * 0.8) { // 0.8 for a tiny bit of leniency
            endGame();
            return;
        }
    }
}

function initGame() {
    player.reset();
    asteroids = [];
    score = 0;
    frameCount = 0;
    scoreVal.innerText = score;
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

function animate() {
    if (gameState !== 'PLAYING') return;

    // Background
    ctx.fillStyle = 'rgba(5, 5, 8, 0.4)'; // trail effect
    ctx.fillRect(0, 0, width, height);
    
    starField.draw();

    // Logic updates
    player.update();
    
    // Asteroid updates
    spawnAsteroids();
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].update();
        asteroids[i].draw();
        
        if (asteroids[i].isOffScreen()) {
            asteroids.splice(i, 1);
        }
    }

    player.draw();
    checkCollisions();

    // Score
    frameCount++;
    if (frameCount % 60 === 0) { // 1 point per second approx
        score += 10;
        scoreVal.innerText = score;
    }

    animationId = requestAnimationFrame(animate);
}

// Background idle animation when not playing
function idleAnimation() {
    if (gameState === 'PLAYING') return;
    ctx.fillStyle = 'rgba(5, 5, 8, 1)';
    ctx.fillRect(0, 0, width, height);
    starField.draw();
    requestAnimationFrame(idleAnimation);
}

// Setup listeners
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Start
idleAnimation();
