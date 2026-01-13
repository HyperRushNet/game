(function() {
    const HyperRush = {
        init: async function(config) {
            // Destructuring met default waarden
            const {
                containerId = 'hyperrush-game',
                nr = null,
                url = null,
                credits = true,
                redirectBlock = true // Default is true
            } = config;

            // 1. Redirect Block Logic - NU GEFIXT
            // Alleen uitvoeren als de gebruiker redirectBlock NIET op false heeft gezet
            if (redirectBlock === true) {
                const inIframe = (() => { 
                    try { 
                        return window.self !== window.top; 
                    } catch (e) { 
                        return true; 
                    } 
                })();

                if (!inIframe) {
                    console.log("HyperRush: Redirecting naar main site...");
                    window.location.replace('https://hyperrushnet.github.io/');
                    return; // Stop de rest van de script uitvoering
                }
            }

            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`HyperRush: Container met id "${containerId}" niet gevonden.`);
                return;
            }

            // 2. CSS Injecteren (Hetzelfde als voorheen)
            const style = document.createElement('style');
            style.textContent = `
                #${containerId} { position:relative; width:100%; height:100%; overflow:hidden; background:#000; font-family:system-ui,-apple-system,sans-serif; }
                .hr-iframe { width:100%; height:100%; border:none; display:block; opacity:0; transition:opacity 0.9s ease; }
                .hr-iframe.loaded { opacity:1; }
                .hr-loader { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000; z-index:99; gap:20px; transition:opacity 0.6s ease; }
                .hr-loader.hidden { opacity:0; pointer-events:none; }
                .hr-spinner { position:relative; width:64px; height:64px; }
                .hr-spinner::before, .hr-spinner::after { content:''; position:absolute; inset:0; border-radius:50%; border:4px solid transparent; }
                .hr-spinner::before { border-top-color:#00d4ff; border-right-color:#00d4ff; animation:hr-spin 1.2s linear infinite; }
                .hr-spinner::after { border-top-color:rgba(0,212,255,0.4); border-bottom-color:rgba(0,212,255,0.4); animation:hr-spin 1.8s linear infinite reverse; box-shadow:0 0 20px rgba(0,212,255,0.5); }
                @keyframes hr-spin { to { transform:rotate(360deg); } }
                .hr-loading-text { color:#fff; font-size:15px; opacity:0.75; letter-spacing:1px; text-transform:uppercase; }
                .hr-credits { position:absolute; bottom:12px; right:16px; z-index:100; font-size:11px; color:#111; background:rgba(255,255,255,0.82); padding:4px 10px; border-radius:5px; text-transform:uppercase; letter-spacing:0.7px; pointer-events:none; animation:hr-fadeOut 8s forwards; }
                @keyframes hr-fadeOut { 0%,65% { opacity:1; } 100% { opacity:0; } }
                #hr-particles { position:absolute; inset:0; pointer-events:none; z-index:2; width:100%; height:100%; }
            `;
            document.head.appendChild(style);

            // 3. Game URL bepalen
            let gameUrl = url;
            if (!gameUrl && nr) {
                try {
                    const res = await fetch('https://hyperrushnet.github.io/assets/json/games.json');
                    const games = await res.json();
                    const game = games.find(g => g.number === parseInt(nr));
                    if (game?.link) gameUrl = 'https://hyperrushnet.github.io' + game.link;
                } catch (e) { console.warn("HyperRush: Kon games.json niet laden."); }
            }
            gameUrl ||= 'https://hyperrushnet.github.io/games-1/bacon-may-die/';

            // 4. HTML Opbouwen
            container.innerHTML = `
                <div class="hr-loader" id="hr-loader">
                    <div class="hr-spinner"></div>
                    <div class="hr-loading-text">Loading HyperRush</div>
                </div>
                <canvas id="hr-particles"></canvas>
                ${credits ? '<div class="hr-credits">Powered by HyperRush</div>' : ''}
            `;

            const iframe = document.createElement('iframe');
            iframe.className = 'hr-iframe';
            iframe.src = gameUrl;
            iframe.allow = 'autoplay; fullscreen; gamepad; keyboard; microphone';
            iframe.sandbox = 'allow-scripts allow-same-origin allow-pointer-lock allow-forms';
            container.appendChild(iframe);

            this.initParticles();

            iframe.onload = () => {
                iframe.classList.add('loaded');
                const loader = document.getElementById('hr-loader');
                if(loader) {
                    loader.classList.add('hidden');
                    setTimeout(() => loader.remove(), 700);
                }
            };
        },

        initParticles: function() {
            const canvas = document.getElementById('hr-particles');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            let particles = [];
            const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
            window.addEventListener('resize', resize);
            resize();

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (particles.length < 30 && Math.random() > 0.9) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: -10,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: Math.random() * 2 + 1,
                        r: Math.random() * 1.5 + 0.5,
                        a: Math.random() * 0.4 + 0.2
                    });
                }
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx; p.y += p.vy; p.a *= 0.99;
                    if (p.y > canvas.height || p.a < 0.01) { particles.splice(i, 1); continue; }
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,212,255,${p.a})`;
                    ctx.fill();
                }
                requestAnimationFrame(animate);
            };
            animate();
        }
    };

    window.HyperRush = HyperRush;
})();
