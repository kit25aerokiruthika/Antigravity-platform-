// main.js - Handles the background stars animation and basic UI logic

const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let stars = [];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
}

class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width; // depth
        this.size = Math.random() * 1.5 + 0.5;
        // Speeds depend on depth to create a parallax effect
        this.baseSpeed = (width - this.z) / width * 0.5; 
        this.speed = this.baseSpeed;
    }

    update() {
        // Simple drifting towards left
        this.x -= this.speed;
        
        // Wrap around
        if (this.x < 0) {
            this.x = width;
            this.y = Math.random() * height;
        }
    }

    draw() {
        const opacity = (1 - this.z / width) * 0.8 + 0.2; // closer means brighter
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initStars() {
    stars = [];
    const numStars = Math.floor((width * height) / 3000); // Responsive star count
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Add a slight gradient background for depth
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    gradient.addColorStop(0, 'rgba(5, 5, 8, 1)');
    gradient.addColorStop(1, 'rgba(2, 2, 4, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animate);
}

// Interactive parallax effect on mouse move
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / width - 0.5;
    
    stars.forEach(star => {
        // Adjust speed slightly based on mouse position to create parallax
        star.speed = star.baseSpeed + (mouseX * 0.5);
    });
});

// Initialize
window.addEventListener('resize', resize);
resize();
animate();

// Login button dummy interaction
document.getElementById('loginBtn').addEventListener('click', () => {
    alert("Login system coming soon!");
});
