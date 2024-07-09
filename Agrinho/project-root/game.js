const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 600;

const images = {};
const items = [];
const obstacles = [];
const player = {
    x: 50,
    y: 100,
    width: 75,
    height: 75,
    frame: 0,
    action: 'walk',
    direction: 'right',
    vy: 0,
    isJumping: false,
    speed: 5,
    swimStrength: -2, // Força da natação ajustada
    gravity: 0.05 // Gravidade ajustada
};

let itemsRecycled = 0;
let lives = 3;
const groundGravity = 0.5;
const jumpStrength = -10;
const groundLevel = 550;
let currentLevel = 'ground';
let gameWon = false;
let keys = {};

// Carrega imagens do jogador e do cenário
function loadImages() {
    const imgFiles = ['frente.png', 'tras.png', 'pulando.png', 'nadando.png', 'background.png', 'water_background.png'];
    imgFiles.forEach((file, index) => {
        const img = new Image();
        img.src = `images/${file}`;
        img.onload = () => {
            images[index] = img;
            if (Object.keys(images).length === imgFiles.length) {
                startGroundLevel();
            }
        };
    });
}

// Inicializa a fase no solo
function startGroundLevel() {
    currentLevel = 'ground';
    player.x = 50;
    player.y = groundLevel - player.height;
    player.vy = 0;
    player.isJumping = false;
    items.length = 0;
    obstacles.length = 0;
    spawnGroundItems();
    spawnGroundObstacles();
    document.getElementById('nextLevel').style.display = 'none';
    requestAnimationFrame(update);
}

// Inicializa a fase na água
function startWaterLevel() {
    currentLevel = 'water';
    player.x = 50;
    player.y = 50;
    player.vy = 1; // Velocidade inicial de queda na fase de água
    player.isJumping = false;
    items.length = 0;
    obstacles.length = 0;
    spawnWaterItems();
    document.getElementById('nextLevel').style.display = 'none';
    requestAnimationFrame(update);
}

// Spawna itens para coleta na fase no solo
function spawnGroundItems() {
    items.push({ x: 300, y: groundLevel - 30, width: 30, height: 30, type: 'lixo' });
    items.push({ x: 600, y: groundLevel - 30, width: 30, height: 30, type: 'lixo' });
    items.push({ x: 900, y: groundLevel - 30, width: 30, height: 30, type: 'lixo' });
}

// Spawna obstáculos na fase no solo
function spawnGroundObstacles() {
    obstacles.push({ x: 400, y: groundLevel - 20, width: 40, height: 20 });
    obstacles.push({ x: 800, y: groundLevel - 20, width: 40, height: 20 });
}

// Spawna itens para coleta na fase na água
function spawnWaterItems() {
    items.push({ x: 300, y: 300, width: 30, height: 30, type: 'garrafa' });
    items.push({ x: 600, y: 400, width: 30, height: 30, type: 'garrafa' });
    items.push({ x: 900, y: 200, width: 30, height: 30, type: 'garrafa' });
}

// Atualiza o estado do jogo
function update() {
    if (gameWon) {
        displayVictoryScreen();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha o cenário
    const backgroundIndex = currentLevel === 'ground' ? 4 : 5;
    ctx.drawImage(images[backgroundIndex], 0, 0, canvas.width, canvas.height);

    // Desenha itens
    items.forEach(item => {
        ctx.fillStyle = item.type === 'lixo' ? 'brown' : 'blue';
        ctx.fillRect(item.x, item.y, item.width, item.height);
    });

    if (currentLevel === 'ground') {
        updateGroundLevel();
    } else {
        updateWaterLevel();
    }

    // Desenha obstáculos
    ctx.fillStyle = 'gray';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Desenha o jogador
    const currentFrame = currentLevel === 'ground' ? images[0] : images[3]; // Frente no solo, nadando na água
    ctx.drawImage(currentFrame, player.x, player.y, player.width, player.height);

    // Verifica colisão
    checkCollision();

    requestAnimationFrame(update);
}

// Atualiza o estado do jogador na fase no solo
function updateGroundLevel() {
    // Gravidade
    player.vy += groundGravity;
    player.y += player.vy;

    // Impedir que o jogador caia abaixo do chão
    if (player.y + player.height >= groundLevel) {
        player.y = groundLevel - player.height;
        player.vy = 0;
        player.isJumping = false;
    }

    // Movimentação horizontal
    if (keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    if (keys['a'] || keys['A']) {
        player.x -= player.speed;
    }

    // Limites da tela
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Atualização de quadro (frame)
    if (player.action === 'walk') {
        player.frame = (player.frame + 1) % 2;
    } else if (player.action === 'jump') {
        player.frame = 2;
    }
}

// Atualiza o estado do jogador na fase na água
function updateWaterLevel() {
    player.vy += player.gravity; // Gravidade na água
    player.y += player.vy;

    // Impedir que o jogador caia abaixo do fundo
    if (player.y + player.height >= canvas.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) {
            alert("Fim de jogo! Você perdeu todas as vidas.");
            startGroundLevel();
            return;
        } else {
            player.x = 50;
            player.y = 50;
            player.vy = 1;
        }
    }

    // Movimentação horizontal
    if (keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    if (keys['a'] || keys['A']) {
        player.x -= player.speed;
    }

    // Limites da tela
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Atualização de quadro (frame)
    player.frame = 3;

    // Verifica se o jogador alcançou o final da fase
    if (player.x + player.width >= canvas.width) {
        gameWon = true;
        localStorage.setItem('itemsRecycled', itemsRecycled); // Salva a quantidade de itens reciclados
    }
}

// Verifica colisão entre jogador e itens
function checkCollision() {
    items.forEach((item, index) => {
        if (player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            items.splice(index, 1);
            itemsRecycled++;
            document.getElementById('itemsRecycled').textContent = itemsRecycled;

            // Se todos os itens foram reciclados na fase do solo, mostrar botão para próxima fase
            if (currentLevel === 'ground' && items.length === 0) {
                document.getElementById('nextLevel').style.display = 'block';
            }
        }
    });

    obstacles.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            // Colisão com obstáculo, reseta posição e diminui vidas
            player.x = 50;
            player.y = groundLevel - player.height;
            player.vy = 0;
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                alert("Fim de jogo! Você perdeu todas as vidas.");
                startGroundLevel();
            }
        }
    });
}

// Controles do jogador
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    if (currentLevel === 'ground') {
        if (event.key === ' ' && !player.isJumping) {
            player.vy = jumpStrength;
            player.isJumping = true;
            player.action = 'jump';
        }
    } else if (currentLevel === 'water') {
        if (event.key === ' ') {
            player.vy = player.swimStrength;
        }
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
    if (currentLevel === 'ground') {
        player.action = 'walk';
    }
});

function displayVictoryScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Parabéns! Você venceu!', canvas.width / 2, canvas.height / 2);
}

loadImages();
