const { Engine, Render, Runner, Bodies, Composite, Constraint, Body, Events } = Matter;

let engine, render, runner, gameMode, vehicleType;
let fuel = 100, score = 0, isGameOver = false;
let car, wheels = [], keys = {};
let audioCtx;

// --- BAŞLATMA DÜZELTMESİ ---
document.getElementById('start-btn').addEventListener('click', function() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('selection-screen').style.display = 'flex';
    console.log("Oyun Başlatıldı");
});

document.getElementById('btn-story').onclick = () => setMode('story');
document.getElementById('btn-free').onclick = () => setMode('free');
document.getElementById('btn-bike').onclick = () => initGame('bike');
document.getElementById('btn-truck').onclick = () => initGame('truck');

function setMode(mode) {
    gameMode = mode;
    document.getElementById('mode-buttons').style.display = 'none';
    document.getElementById('selection-title').innerText = "ARAÇ SEÇİN";
    document.getElementById('vehicle-buttons').style.display = 'block';
}

function initGame(v) {
    vehicleType = v;
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    if (window.innerWidth < 1024) document.getElementById('mobile-controls').style.display = 'flex';

    engine = Engine.create();
    engine.world.gravity.y = 1.4;

    render = Render.create({
        element: document.body,
        engine: engine,
        options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: '#87CEEB' }
    });

    createVehicle();
    createWorld();
    
    runner = Runner.run(engine);
    Render.run(render);
    isGameOver = false;
    requestAnimationFrame(gameLoop);
}

function createVehicle() {
    const x = 300, y = 300;
    if (vehicleType === 'bike') {
        car = Bodies.rectangle(x, y, 60, 15, { render: {fillStyle: '#f90'}, label: 'car' });
        wheels = [Bodies.circle(x-25, y+20, 20, {friction: 2}), Bodies.circle(x+25, y+20, 20, {friction: 2})];
    } else {
        car = Bodies.rectangle(x, y, 100, 40, { render: {fillStyle: '#17d'}, label: 'car' });
        wheels = [Bodies.circle(x-35, y+30, 30, {friction: 3}), Bodies.circle(x+35, y+30, 30, {friction: 3})];
    }
    const constraints = wheels.map((w, i) => Constraint.create({
        bodyA: car, pointB: { x: i===0?-30:30, y: 15 }, bodyB: w, stiffness: 0.1, length: 10, render: {visible: false}
    }));
    Composite.add(engine.world, [car, ...wheels, ...constraints]);
}

function createWorld() {
    const len = gameMode === 'story' ? 100 : 5000;
    for (let i = 0; i < len; i++) {
        const x = i * 180;
        const y = 650 + Math.sin(i * 0.4) * 60;
        const ground = Bodies.rectangle(x, y, 190, 60, { isStatic: true, friction: 1, angle: Math.sin(i*0.4)*0.1, render: {fillStyle: '#2e7d32'} });
        Composite.add(engine.world, ground);
        if (i > 5 && i % 10 === 0) {
            const item = Bodies.circle(x, y-100, 15, { isSensor: true, label: (i%20===0?'f':'c'), render: {fillStyle: (i%20===0?'#f00':'#fd0')} });
            Composite.add(engine.world, item);
        }
    }
}

// --- KONTROL DÜZELTMELERİ ---
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mobil dokunma
const gasBtn = document.getElementById('m-gas');
const brakeBtn = document.getElementById('m-brake');
gasBtn.ontouchstart = () => keys['gas'] = true;
gasBtn.ontouchend = () => keys['gas'] = false;
brakeBtn.ontouchstart = () => wheels.forEach(w => Body.setAngularVelocity(w, -0.2));

function gameLoop() {
    if (isGameOver) return;
    if (keys['ArrowRight'] || keys['gas']) {
        wheels.forEach(w => Body.setAngularVelocity(w, 0.4));
        fuel -= 0.1;
    }
    fuel -= 0.02;
    document.getElementById('fuel-bar').style.width = fuel + "%";
    document.getElementById('dist-val').innerText = Math.floor(car.position.x / 10);
    Render.lookAt(render, car, { x: 500, y: 400 });

    if (fuel <= 0 || car.position.y > 1500) {
        isGameOver = true;
        alert("OYUN BİTTİ!");
        location.reload();
    }
    requestAnimationFrame(gameLoop);
}

Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(p => {
        const other = p.bodyA.isSensor ? p.bodyA : (p.bodyB.isSensor ? p.bodyB : null);
        if (other) {
            if (other.label === 'f') fuel = 100;
            if (other.label === 'c') score += 10;
            document.getElementById('coin-val').innerText = score;
            Composite.remove(engine.world, other);
        }
    });
});
