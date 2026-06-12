/* ============================================================
   Hero 3D scene — flowing particle wave field ("ember ocean")
   GPU shader-driven: wave motion runs in the vertex shader so
   thousands of points animate at 60fps with no CPU cost.
   Loaded as a module so a CDN failure can't break the page.
   Skipped entirely under prefers-reduced-motion.
   ============================================================ */

import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && !reducedMotion) {
    try {
        initScene();
    } catch (err) {
        console.warn('WebGL unavailable, hero falls back to static background:', err.message);
        canvas.remove();
    }
}

function initScene() {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
    camera.position.set(0, 3.2, 13);

    const uniforms = {
        uTime: { value: 0 },
        uColorLow: { value: new THREE.Color('#7c2d12') },   // deep ember
        uColorMid: { value: new THREE.Color('#f59e0b') },   // amber
        uColorHigh: { value: new THREE.Color('#f43f5e') }   // rose crest
    };

    /* --- Wave field: a wide plane of points, displaced by layered sines --- */
    const FIELD_W = 90, FIELD_D = 50;
    const SEG_W = 150, SEG_D = 85;
    const waveGeo = new THREE.PlaneGeometry(FIELD_W, FIELD_D, SEG_W, SEG_D);
    waveGeo.rotateX(-Math.PI / 2);

    const waveMat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
            uniform float uTime;
            varying float vElev;
            varying float vDepth;

            void main() {
                vec3 p = position;
                float t = uTime;

                float e =
                    sin(p.x * 0.32 + t * 0.9)  * cos(p.z * 0.28 + t * 0.55) * 0.85 +
                    sin(p.x * 0.11 - t * 0.45) * 1.15 +
                    cos(p.z * 0.16 + t * 0.65) * 0.65 +
                    sin((p.x + p.z) * 0.21 + t * 0.8) * 0.45;

                p.y += e;
                vElev = e;

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                vDepth = -mv.z;
                gl_PointSize = clamp(120.0 / vDepth, 1.2, 4.5);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColorLow;
            uniform vec3 uColorMid;
            uniform vec3 uColorHigh;
            varying float vElev;
            varying float vDepth;

            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;

                float t = clamp((vElev + 2.6) / 5.2, 0.0, 1.0);
                vec3 col = t < 0.55
                    ? mix(uColorLow, uColorMid, t / 0.55)
                    : mix(uColorMid, uColorHigh, (t - 0.55) / 0.45);

                float soft = smoothstep(0.5, 0.08, d);
                float fade = clamp(1.5 - vDepth / 45.0, 0.0, 1.0);
                gl_FragColor = vec4(col, soft * fade * 0.85);
            }
        `
    });

    const wave = new THREE.Points(waveGeo, waveMat);
    wave.position.y = -3.4;
    scene.add(wave);

    /* --- Floating ember sparks drifting above the waves --- */
    const SPARKS = 220;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkSeed = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
        sparkPos[i * 3] = (Math.random() - 0.5) * 55;
        sparkPos[i * 3 + 1] = Math.random() * 14 - 2;
        sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        sparkSeed[i] = Math.random() * 6.28;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeed, 1));

    const sparkMat = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
            uniform float uTime;
            attribute float aSeed;
            varying float vTwinkle;

            void main() {
                vec3 p = position;
                p.y += sin(uTime * 0.35 + aSeed) * 0.9;
                p.x += cos(uTime * 0.22 + aSeed * 2.0) * 0.7;
                vTwinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 3.0));

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = clamp(70.0 / -mv.z, 1.0, 3.2);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uColorMid;
            varying float vTwinkle;

            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                float soft = smoothstep(0.5, 0.05, d);
                gl_FragColor = vec4(uColorMid, soft * vTwinkle * 0.7);
            }
        `
    });
    scene.add(new THREE.Points(sparkGeo, sparkMat));

    /* --- Mouse parallax --- */
    const mouse = { x: 0, y: 0 };
    window.addEventListener('pointermove', e => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* --- Resize --- */
    function resize() {
        const { clientWidth: w, clientHeight: h } = canvas.parentElement;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* --- Animate (paused when hero is off-screen) --- */
    let running = true;
    new IntersectionObserver(entries => {
        running = entries[0].isIntersecting;
        if (running) requestAnimationFrame(animate);
    }).observe(canvas.parentElement);

    const clock = new THREE.Clock();

    function animate() {
        if (!running) return;
        requestAnimationFrame(animate);

        uniforms.uTime.value = clock.getElapsedTime();

        camera.position.x += (mouse.x * 1.6 - camera.position.x) * 0.04;
        camera.position.y += (3.2 - mouse.y * 0.9 - camera.position.y) * 0.04;
        camera.lookAt(0, 0.5, 0);

        renderer.render(scene, camera);
    }
    animate();
}
