function isColliding(box1, box2) {
    return  box1.x-box1.w/2 < box2.x + box2.w/2 &&
            box1.x + box1.w/2 > box2.x - box2.w/2 &&
            box1.y - box1.h/2 < box2.y + box2.h/2 &&
            box1.y + box1.h/2 > box2.y - box2.h/2;
};
function squaredDistance(box1, box2) {
    dx = box1.x-box2.x;
    dy = box1.y-box2.y;
    return dx*dx + dy*dy;
};

function drawSprite(sprite, box) {
    ctx.drawImage(sprite, box.x-box.w/2, box.y-box.h/2, box.w, box.h);
}

// Sprites
const playerSprite = new Image();
playerSprite.src = "images/Santa.png";
const playerLifeBackSprite = new Image();
playerLifeBackSprite.src = "images/playerLifeBack.png";
const playerLifeFrontSprite = new Image();
playerLifeFrontSprite.src = "images/playerLifeFront.png";
const starSprite = new Image();
starSprite.src = "images/Star.png";
const enemySprites = [];
for (let i = 0; i <= 31; i++) {
    const index = i.toString().padStart(2, "0");
    const img = new Image();
    img.src = `images/enemies/${index}.png`;
    enemySprites.push(img);
}
const starBackground = new Image("i");
starBackground.src = "images/StarsBG.png";

const itemAutoTargetingSprite = new Image();
itemAutoTargetingSprite.src = "images/items/autoTargeting.png";
const itemBigStarsSprite = new Image();
itemBigStarsSprite.src = "images/items/bigStars.png";
const itemFastShootingSprite = new Image();
itemFastShootingSprite.src = "images/items/fastShooting.png";
const itemBonusHpSprite = new Image();
itemBonusHpSprite.src = "images/items/bonusHp.png";

// Audio
const bgMusic = new Audio("audio/main.wav"); 
bgMusic.loop = true;
bgMusic.volume = 0.5;
function startMusic() {
    bgMusic.play().catch(err => console.log("Music play failed:", err));
    window.removeEventListener("click", startMusic);
    window.removeEventListener("keydown", startMusic);
}
window.addEventListener("click", startMusic);
window.addEventListener("keydown", startMusic);
const enemyHitSound = new Audio("audio/cookie_hurt.wav");
const playerHitSound = new Audio("audio/player_hurt.wav");

// Globals
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;

let player = {
    maxHp: 10,
    hp: 10,
    x: 80,
    y: canvas.height/2,
    shootCooldown: 0.2,
    shootTimer: 0.0,
    w: 80,
    h: 80,
    speed: 2.0
};

let items = [];
let stars = [];
let cookies = [];
let cookieSpawnTimer = 0.0;
let itemSpawnTimer = 0.0;

// ==================
// SPECIAL EFFECTS

let specialEffects = [];

function addSpecialEffect(effect) {
    for (let i =0; i < specialEffects.length; i++) {
        if (specialEffects[i].name === effect.name) {
            specialEffects[i].timer += effect.timer;
            return;
        }
    }
    specialEffects.push(effect);
};

function hasSpecialEffect(name) {
    for (let i =0; i < specialEffects.length; i++) {
        if (specialEffects[i].name === name
            && specialEffects[i].timer > 0) {
            return true;
        }
    }
    return false;
};

function updateSpecialEffects(deltaTime) {
    specialEffects.forEach(e => {
        if (e.timer > 0) {e.timer -= deltaTime || 0;}
    });
};

// ==================
// PARTICLES

class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        const alpha = Math.max(this.life / this.maxLife, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    get dead() {
        return this.life <= 0;
    }
}

const particles = [];

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].dead) particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    particles.forEach(p => p.draw(ctx));
}

function emitParticles(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;

        particles.push(
            new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() * 0.5 + 0.3,
                Math.random() * 3 + 2,
                "orange"
            )
        );
    }
}

// Input handling
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Game loop
function update(deltaTime) {
    if (player.hp <= 0) {
        if (keys["r"] || keys["R"]) {
            // Restart Game after Game Over
            score = 0;
            player.y = canvas.height / 2;
            player.hp = player.maxHp;
            stars = [];
            cookies = [];
            specialEffects = [];
        }
        return;
    }

    updateSpecialEffects(deltaTime);

    // Player dynamic speed
    player.speed = 2+(score/80000.0);

    // Player movement
    if (keys["ArrowUp"] || keys["w"]) {player.y -= player.speed;}
    if (keys["ArrowDown"] || keys["s"]) {player.y += player.speed;}
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // Player shoot
    if (player.shootTimer > 0.0) {player.shootTimer -= deltaTime || 0;}
    if (player.shootTimer <= 0) {
            player.shootTimer = player.shootCooldown;
            if (hasSpecialEffect("fastShooting")) {player.shootTimer /= 2.125;}
            let star = {
                x: player.x,
                y: player.y,
                w: 16, h: 16,
                speed: 5,
                dmg: 1
            };
            if (hasSpecialEffect("bigStars")) {
                star.w *= 3;
                star.h *= 3;
                star.dmg = 10;
            }
            stars.push(star);
        }

    // Star Update
    for (let i = stars.length - 1; i >= 0; i--) {
        let star = stars[i];

        if (hasSpecialEffect("autoTargeting") && cookies.length > 0) {
            // Move towards nearest enemy
            d_min = 9999;
            nearest_cookie = null;
            cookies.forEach(cookie => {
                d = Math.sqrt(squaredDistance(star, cookie));
                if (d < d_min) {
                    d_min = d;
                    nearest_cookie = cookie;
                }
            });
            if (nearest_cookie != null) {
                star.x += star.speed * (nearest_cookie.x - star.x) / d_min;
                star.y += star.speed * (nearest_cookie.y - star.y) / d_min;
            }
        } else {
            star.x += star.speed;
        }

        if (star.x-star.w >= canvas.width) {stars.splice(i, 1);}

        // Collision with item
        for (let i_i = items.length - 1; i_i >= 0; i_i--) {
            let item = items[i_i];
            if (isColliding(star, item)) {
                addSpecialEffect(item.effect);
                stars.splice(i, 1);
                items.splice(i_i, 1);
                break;
            }
        }
    }


    // Cookie spawning
    if (cookieSpawnTimer > 0.0) {cookieSpawnTimer -= deltaTime || 0;}
    if (cookieSpawnTimer <= 0) {
        let cookie = {
            maxHp: (Math.floor(Math.random()*5) + 1) + (score / 75000.0),
            hp: 1,
            x: canvas.width + 50,
            y: Math.random() * canvas.height,
            w: 50,
            h: 50,
            xSpeed: -1,
            ySpeed: 0,
            sprite: enemySprites[Math.floor(Math.random() * enemySprites.length)],
            rotation: 0,
            rotationSpeed: 0.05
        };
        spd = (Math.random()+1) + (score / 40000.0);
        d = Math.sqrt(squaredDistance(cookie, player));
        cookie.xSpeed = spd * (player.x - cookie.x) / d;
        cookie.ySpeed = spd * (player.y - cookie.y) / d;

        cookie.hp = cookie.maxHp;
        cookies.push(cookie);

        cookieSpawnTimer = (Math.random() + 3) / player.speed;
    }

    // Cookie update code
    for (let i_c = cookies.length - 1; i_c >= 0; i_c--) {
        let cookie = cookies[i_c];

        // Movement
        cookie.x += cookie.xSpeed;
        cookie.y += cookie.ySpeed;
        if (cookie.x+cookie.w <= 0) {cookies.splice(i_c, 1);}
        cookie.rotation += cookie.rotationSpeed;
        if (cookie.rotation >= 2*Math.PI) {cookie.rotation -= 2*Math.PI;}

        // Collision with star
        for (let i_s = stars.length - 1; i_s >= 0; i_s--) {
            let star = stars[i_s];
            if (isColliding(cookie, star))
            {
                // Hit cookie
                cookie.hp -= star.dmg;
                stars.splice(i_s, 1);

                if (cookie.hp <= 0) {
                    emitParticles(cookie.x, cookie.y);
                    cookies.splice(i_c, 1);
                    enemyHitSound.play();
                    score += 100;
                } else {
                    score += 10;
                    emitParticles(cookie.x, cookie.y, 1);
                }
            }
        }

        // Collision with Player
        if (isColliding(cookie, player)) {
            cookies.splice(i_c, 1);
            playerHitSound.play();
            player.hp -= 1;
        }
    }

    // Item Spawning
    if (itemSpawnTimer > 0.0) {itemSpawnTimer -= deltaTime || 0};
    if (itemSpawnTimer <= 0.0) {
        let item = {
            x: canvas.width/2,
            y: canvas.height/2,
            w:32, h: 32,
            effect: {},
            sprite: null
        }
        r = Math.random();
        if (r < 0.25) {
            item.effect = {
                name: "fastShooting",
                cooldown: 10,
                timer: 10
            };
            item.sprite = itemFastShootingSprite;
        } else if (r < 0.5) {
            item.effect = {
                name: "autoTargeting",
                cooldown: 10,
                timer: 10
            };
            item.sprite = itemAutoTargetingSprite;
        } else if (r < 0.75) {
            item.effect = {
                name: "bigStars",
                cooldown: 10,
                timer: 10
            };
            item.sprite = itemBigStarsSprite;
        } else {
            item.effect = {
                name: "bonusHp",
                cooldown: 0.0000001,
                timer: 0.00000001
            };
            item.sprite = itemBonusHpSprite;
        }
        items.push(item);
        itemSpawnTimer = 30;
    }

    updateParticles(deltaTime);
}

let bgOffset = 0;
function draw() {
    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#001d3d");
    gradient.addColorStop(0.5, "#003566");
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (player.hp <= 0) {
        // Game Over
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "64px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80);

        ctx.font = "48px Arial";
        ctx.fillText("Your Score: "+score, canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "24px Arial";
        ctx.fillText("Press 'R' to restart",
            canvas.width / 2,
            canvas.height / 2 + 30
        );
        return;
    }

    // Bonus Hp
    if (hasSpecialEffect("bonusHp") && player.hp < player.maxHp) {
        player.hp += 1;
    }

    // Draw Background Parallax Overlay
    {
        const imgWidth = starBackground.width;
        ctx.drawImage(starBackground, bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(starBackground, bgOffset+canvas.width, 0, canvas.width, canvas.height);
        bgOffset -= player.speed;
        if (bgOffset < -canvas.width) {
            bgOffset = 0;
        }
    }

    // Draw Items
    items.forEach(item => {
        drawSprite(item.sprite, item);
        //ctx.fillRect(star.x-star.w/2, star.y-star.h/2, star.w, star.h);
    });

    // Draw Projectiles Stars
    stars.forEach(star => {
        ctx.fillStyle = "orange";
        drawSprite(starSprite, star);
        //ctx.fillRect(star.x-star.w/2, star.y-star.h/2, star.w, star.h);
    });

    // Draw Cookies
    cookies.forEach(cookie => {
        ctx.save();
        ctx.translate(cookie.x, cookie.y);
        ctx.rotate(cookie.rotation);
        ctx.drawImage(cookie.sprite, -cookie.w/2, -cookie.h/2, cookie.w, cookie.h);
        ctx.restore();
    });

    // Draw Player
    drawSprite(playerSprite, player);

    // Draw Score
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + score, canvas.width-10, 10);

    // Draw Player HP
    for (let i = 0; i < player.maxHp; i++) {
        if (i < player.hp) {
            ctx.drawImage(playerLifeFrontSprite, 8+32*i, 8, 32, 32);
        } else {
            ctx.drawImage(playerLifeBackSprite, 8+32*i, 8, 32, 32);
        }
    }

    drawParticles(ctx);
}

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;
    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();