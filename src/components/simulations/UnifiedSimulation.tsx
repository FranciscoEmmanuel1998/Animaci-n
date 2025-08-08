import { useEffect, useRef } from 'react'

/**
 * UnifiedSimulation con innovaciones (continuo, sin resets duros):
 * - TypedArrays + reglas adaptativas
 * - Temperatura autorreguladora + trail histórico
 * - Rescate adaptativo (gliders / semillas) sin reiniciar generación
 * - Lorenz attractor overlay
 */
export const UnifiedSimulation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.offsetWidth * 2)
    const height = (canvas.height = canvas.offsetHeight * 2)
    ctx.scale(2, 2)

    const cellSize = 4
    const cols = Math.floor(width / cellSize / 2)
    const rows = Math.floor(height / cellSize / 2)
    const size = rows * cols

    let current = new Uint8Array(size)
    let next = new Uint8Array(size)
    let temperature = new Float32Array(size)
    let decayTrail = new Float32Array(size)

    let generation = 0
    let previousLive = -1
    let stagnation = 0

    const idx = (r: number, c: number) => r * cols + c

    const initializeGrid = () => {
      current.fill(0); next.fill(0); temperature.fill(0); decayTrail.fill(0)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = cols / 2, cy = rows / 2
          const d = Math.hypot(c - cx, r - cy)
          let alive = 0
          if (d < 20) alive = Math.random() > 0.6 ? 1 : 0
          else if (d < 35 && Math.random() > 0.85) alive = 1
          else if (Math.random() > 0.97) alive = 1
          current[idx(r, c)] = alive
        }
      }
    }

    const countNeighbors = (r: number, c: number) => {
      let n = 0
      for (let dr = -1; dr <= 1; dr++) {
        const rr = (r + dr + rows) % rows
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const cc = (c + dc + cols) % cols
          n += current[idx(rr, cc)]
        }
      }
      return n
    }

    let ruleLife = 1, ruleHigh = 0, ruleSeeds = 0
    const normalize = () => { const s = ruleLife + ruleHigh + ruleSeeds; ruleLife/=s; ruleHigh/=s; ruleSeeds/=s }
    const adaptRules = (density: number, entropy: number) => {
      if (density > 0.38) ruleSeeds += 0.002
      if (density < 0.18) ruleHigh += 0.002
      if (density >= 0.18 && density <= 0.38) ruleLife += 0.002
      if (entropy < 0.55) ruleHigh += 0.001
      if (entropy > 0.9) ruleLife += 0.002
      ruleLife *= 0.9995; ruleHigh *= 0.9995; ruleSeeds *= 0.9995; normalize()
    }

    const addGlider = (r: number, c: number) => {
      const pattern = [[0,1,0],[0,0,1],[1,1,1]]
      for (let pr=0; pr<3; pr++) for (let pc=0; pc<3; pc++) {
        const rr = (r+pr+rows)%rows; const cc=(c+pc+cols)%cols
        current[idx(rr,cc)] = pattern[pr][pc]
      }
    }
    const injectGliders = (count: number) => { for (let k=0;k<count;k++){ const edge=Math.random()<0.5; if(edge) addGlider(Math.floor(Math.random()*3), Math.floor(Math.random()*cols)); else addGlider(Math.floor(Math.random()*rows), Math.floor(Math.random()*3)); } }
    const randomScatter = (fraction: number) => { const target = Math.floor(size * fraction); for (let k=0;k<target;k++){ const id = Math.floor(Math.random()*size); current[id]=1 } }
    const estEntropy = (d:number) => d===0||d===1?0:-(d*Math.log2(d)+(1-d)*Math.log2(1-d))

    let lowEntropyStreak = 0

    const update = () => {
      let live = 0
      const birthW = new Array(9).fill(0)
      birthW[3]+=ruleLife; birthW[3]+=ruleHigh; birthW[6]+=ruleHigh; birthW[2]+=ruleSeeds
      const survW = new Array(9).fill(0); survW[2]+=ruleLife+ruleHigh; survW[3]+=ruleLife+ruleHigh
      const maxB=Math.max(...birthW), maxS=Math.max(...survW)
      const birth = birthW.map(w=> w>0 && w >= maxB*0.45)
      const surv = survW.map(w=> w>0 && w >= maxS*0.45)

      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        const id = idx(r,c)
        const cell = current[id]
        const n = countNeighbors(r,c)
        const temp = temperature[id]*0.985 + cell*0.45; temperature[id]=temp
        const hot = temp>6
        let ns = cell
        if (cell) { ns = surv[n]?1:0; if(hot && Math.random()<0.08) ns=0 } else { if(!hot && birth[n]) ns=1; else if(hot && birth[n] && Math.random()<0.15) ns=1 }
        if (Math.random()<0.00018) ns = 1-ns
        next[id]=ns; if(ns) live++
        decayTrail[id]=decayTrail[id]*0.94 + ns*1.7 + (cell&&!ns?0.3:0); if(decayTrail[id]>12) decayTrail[id]=12
      }
      const tmp=current; current=next; next=tmp; next.fill(0); generation++

      const density = live/size
      const H = estEntropy(density)
      adaptRules(density,H)

      if (H < 0.55) lowEntropyStreak++; else lowEntropyStreak=0
      if (lowEntropyStreak > 30) { injectGliders(4); lowEntropyStreak=0 }
      if (density < 0.02 && generation % 20 === 0) injectGliders(6)

      // --- Continuidad adaptativa: sin reset ---
      if (previousLive === live) stagnation++; else stagnation=0; previousLive=live
      if (stagnation > 120) { injectGliders(5); randomScatter(0.008); stagnation=0 }
      if (live === 0) { randomScatter(0.02); injectGliders(8) }
    }

    /* Lorenz */
    const sigma = 10, rho = 28, beta = 8/3, dt = 0.01
    let x=1,y=1,z=1
    const points:{x:number;y:number;z:number;age:number}[]=[]
    const maxPoints=2000

    let lastUpdate=0; const interval=90

    const drawCells = () => {
      const ruleHue = (ruleLife*210 + ruleHigh*280 + ruleSeeds*40)%360
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        const id=idx(r,c); const alive=current[id]; const trail=decayTrail[id]
        if (!alive && trail<=0.25) continue
        const n = alive?countNeighbors(r,c):0
        const t = temperature[id]
        const heatShift=Math.min(60,t*4)
        const hue=(ruleHue + n*18 + heatShift + generation*0.15 + trail*2)%360
        const sat= alive? 60+Math.min(30,n*6) : 35+Math.min(25,trail*2)
        const baseL=50+Math.sin(generation*0.07 + r*0.09 + c*0.05)*15
        const light = alive? baseL+Math.min(15,t*1.2) : 18+Math.min(22,trail*2.4)
        const alpha = alive?0.95:Math.min(0.4, trail*0.08)
        ctx.fillStyle=`hsla(${hue},${sat}%,${Math.max(14,Math.min(80,light))}%,${alpha})`
        ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize)
      }
    }

    const animate = (ts:number) => {
      ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(0,0,width/2,height/2)
      if (ts - lastUpdate > interval) { update(); lastUpdate=ts }
      drawCells()
      const dx = sigma*(y-x), dy = x*(rho - z) - y, dz = x*y - beta*z
      x+=dx*dt; y+=dy*dt; z+=dz*dt
      points.push({x,y,z,age:0}); if(points.length>maxPoints) points.shift()
      ctx.save(); ctx.globalCompositeOperation='lighter'
      points.forEach(p=>{ const alpha=Math.max(0,1-p.age/maxPoints); p.age++; const t=ts*0.001; const cosT=Math.cos(t*0.3); const sinT=Math.sin(t*0.3); const px=p.x*cosT - p.z*sinT; const pz=p.x*sinT + p.z*cosT; const py=p.y; const sx=px*8 + width/4; const sy=py*8 + height/4; const hue=(p.z*10 + 270 + generation*0.05)%360; const bright=Math.max(0.3,0.8 - pz*0.02); ctx.fillStyle=`hsla(${hue},100%,${bright*70}%,${alpha*0.5})`; ctx.beginPath(); ctx.arc(sx,sy,Math.max(1,3 - pz*0.1),0,Math.PI*2); ctx.fill(); })
      ctx.restore()
      animationRef.current = requestAnimationFrame(animate)
    }

    initializeGrid()
    animationRef.current = requestAnimationFrame(animate)

    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [])

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-quantum-chaos/10 pointer-events-none" />
    </div>
  )
}

export default UnifiedSimulation
