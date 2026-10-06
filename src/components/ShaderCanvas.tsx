import React, { useEffect, useRef } from 'react';
import { MoodAtmosphere } from '../types';

interface ShaderCanvasProps {
  mood: MoodAtmosphere;
}

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();
    window.addEventListener('resize', syncSize);

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform int u_mood;
      varying vec2 v_texCoord;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float aspect = u_resolution.x / u_resolution.y;
          vec2 p = uv;
          p.x *= aspect;

          float t = u_time * 0.15;
          
          float n1 = snoise(p * 0.8 + vec2(t * 0.2, t * 0.15));
          float n2 = snoise(p * 1.5 - vec2(t * 0.1, -t * 0.25) + n1 * 0.4);
          float n3 = snoise(p * 2.2 + vec2(sin(t * 0.3), cos(t * 0.2)) + n2 * 0.3);

          vec3 baseColor = vec3(0.06, 0.07, 0.09);
          vec3 indigoHaze = vec3(0.11, 0.14, 0.20);
          vec3 warmAmber = vec3(0.72, 0.44, 0.25);
          vec3 dustyRose = vec3(0.52, 0.30, 0.34);
          vec3 subtleGold = vec3(0.85, 0.65, 0.40);

          if (u_mood == 1) { // Noche Índigo
            indigoHaze = vec3(0.08, 0.18, 0.32);
            warmAmber = vec3(0.25, 0.45, 0.72);
            dustyRose = vec3(0.20, 0.25, 0.45);
            subtleGold = vec3(0.50, 0.70, 0.90);
          } else if (u_mood == 2) { // Niebla Sepia
            indigoHaze = vec3(0.18, 0.15, 0.12);
            warmAmber = vec3(0.65, 0.50, 0.35);
            dustyRose = vec3(0.45, 0.35, 0.25);
            subtleGold = vec3(0.75, 0.65, 0.45);
          } else if (u_mood == 3) { // Alba Pálida
            indigoHaze = vec3(0.16, 0.14, 0.18);
            warmAmber = vec3(0.80, 0.55, 0.50);
            dustyRose = vec3(0.60, 0.40, 0.50);
            subtleGold = vec3(0.90, 0.75, 0.70);
          }

          float blend1 = smoothstep(-0.6, 0.8, n1 + (uv.y - 0.5) * 0.5);
          float blend2 = smoothstep(-0.3, 0.9, n2);
          float blend3 = smoothstep(0.1, 0.9, n3);

          vec3 col = mix(baseColor, indigoHaze, uv.y * 0.8);
          col = mix(col, dustyRose * 0.4, blend1 * 0.6);
          col = mix(col, warmAmber * 0.5, blend2 * 0.5);
          col = mix(col, subtleGold * 0.35, blend3 * 0.3);

          float grain = fract(sin(dot(uv * u_time, vec2(12.9898, 78.233))) * 43758.5453);
          col += (grain - 0.5) * 0.045;

          float vig = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
          vig = clamp(pow(16.0 * vig, 0.25), 0.0, 1.0);
          col *= vig;

          gl_FragColor = vec4(col, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMood = gl.getUniformLocation(program, 'u_mood');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = window.innerHeight - e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    function render(t: number) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      
      let moodCode = 0;
      if (mood === 'Noche Índigo') moodCode = 1;
      else if (mood === 'Niebla Sepia') moodCode = 2;
      else if (mood === 'Alba Pálida') moodCode = 3;
      if (uMood) gl.uniform1i(uMood, moodCode);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mood]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-85 block" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(12,14,19,0.82)_80%,rgba(8,9,13,0.96)_100%)] mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#f2be8c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div id="ambient-mood-glow" className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#f2be8c]/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-out animate-breath-glow" />
    </div>
  );
};
