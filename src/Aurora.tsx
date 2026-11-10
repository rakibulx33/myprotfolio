import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./hooks";

/* The light behind the page: slow ribbons of turquoise, blue, pink and a little marigold, drawn by a fragment
   shader on one fixed canvas. It drifts on its own, bends toward the pointer and dims once you scroll past the hero,
   so text stays readable. It renders at a fraction of the screen's pixels (the picture is soft anyway), pauses
   when the tab is hidden, and draws a single still frame with reduced motion. Without WebGL the CSS gradient
   under it shows instead. */

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FRAG = `
precision highp float;
uniform vec2 r;   // canvas size
uniform float t;  // seconds
uniform vec2 m;   // pointer, 0..1
uniform float k;  // intensity: 1 in the hero, lower below it
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  vec2 mp=(m-.5)*vec2(r.x/r.y,1.);
  float tt=t*.05;
  // Warp the plane with two slow noise fields, and let the pointer push it a little.
  vec2 q=vec2(fbm(p*1.25+vec2(0.,tt)),fbm(p*1.25+vec2(5.2,-tt*1.3)));
  vec2 w=p+1.5*(q-.5)+.18*(mp-p)*exp(-2.5*length(mp-p));
  float f=fbm(w*1.5+vec2(tt*.9,tt*.35));
  float band=smoothstep(.38,.78,f);
  float ridge=pow(1.-abs(2.*fbm(w*2.3-tt)-1.),4.);
  vec3 c1=vec3(.10,.90,.82),c2=vec3(.36,.55,1.),c3=vec3(1.,.30,.62),c4=vec3(1.,.82,.25);
  vec3 col=mix(c1,c2,smoothstep(.25,.6,q.x));
  col=mix(col,c3,smoothstep(.42,.8,q.y));
  col=mix(col,c4,.5*ridge*smoothstep(.55,.9,f));
  float glow=band*.5+ridge*.42;
  // Brightest toward the upper right, where the portrait sits; darkest where the text is.
  float place=smoothstep(1.35,.05,length(p-vec2(.5,.22)));
  vec3 o=vec3(.02,.024,.058)+col*glow*(.16+.84*place)*k;
  o+=col*.10*k*exp(-7.*length(p-mp));
  o+=(h(gl_FragCoord.xy+fract(t))-.5)*.022; // grain
  gl_FragColor=vec4(o,1.);
}`;

export default function Aurora() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!canvas || !gl) return;

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one triangle covers the screen
    const a = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = { r: gl.getUniformLocation(prog, "r"), t: gl.getUniformLocation(prog, "t"), m: gl.getUniformLocation(prog, "m"), k: gl.getUniformLocation(prog, "k") };

    const still = prefersReducedMotion();
    const small = window.matchMedia("(max-width: 760px)").matches;
    const scale = small ? 0.34 : 0.5; // fraction of CSS pixels that are actually shaded
    const mouse = { x: 0.72, y: 0.7, tx: 0.72, ty: 0.7 };
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = Math.max(2, Math.round(window.innerWidth * scale));
      canvas.height = Math.max(2, Math.round(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const past = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      gl.uniform2f(u.r, canvas.width, canvas.height);
      gl.uniform1f(u.t, now / 1000 + 40);
      gl.uniform2f(u.m, mouse.x, mouse.y);
      gl.uniform1f(u.k, 1 - 0.58 * past);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < (small ? 40 : 24)) return; // about 25 fps on phones, 40 on desktop: it moves slowly
      last = now;
      draw(now);
    };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / window.innerWidth; mouse.ty = 1 - e.clientY / window.innerHeight; };
    const onScroll = () => { if (still) draw(0); };
    const onVisible = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = requestAnimationFrame(loop);
    };
    const onResize = () => { resize(); draw(performance.now()); };

    resize();
    draw(0);
    canvas.classList.add("on");
    if (!still) raf = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} className="aurora" aria-hidden />;
}
