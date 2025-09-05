import { useEffect, useRef, useState } from 'react';
// Pattern archetypes & utilities (generic injection framework)
import { PATTERNS, pickPatternByRarity, stampPattern, sampleNeighborhoodSignature } from './patternArchetypes';

export const CellularAutomaton = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [extinct, setExtinct] = useState(false); // manual restart cuando universo muere
  const [debug, setDebug] = useState(false); // modo explicación visual
  const controlsRef = useRef<{ spawnInvasion: () => void } | null>(null);
  const testControlsRef = useRef<{ 
    spawnSpeciesEvolution: () => void;
    spawnNuclearWarfare: () => void; 
    spawnGalacticWar: () => void;
  } | null>(null);
  const clustersRef = useRef<{x:number;y:number;w:number;h:number;size:number}[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.offsetWidth * 2);
    const height = (canvas.height = canvas.offsetHeight * 2);
    ctx.scale(2, 2);

    const cellSize = 4;
    const cols = Math.floor(width / cellSize / 2);
    const rows = Math.floor(height / cellSize / 2);
    const cellCount = rows * cols;

    let currentGeneration: number[][] = [];
    let nextGeneration: number[][] = [];
    // --- War mode (extraterrestrial invasion) separate layer ---
    let invaderGrid: number[][] = [];
    let nextInvaderGrid: number[][] = [];
    const warMode = true; // always active per user request
    const extralifeOnlyInvasion = true; // si muere, solo invasores pueden reintroducir dinámica

    // Generation counter declared early so helpers can close over it safely
    let generation = 0;

    // Metrics & adaptive state
    let previousLiveCount = -1;
    let stagnationCounter = 0; // increments when liveCount doesn't change
    let averageEnergy = 0;
    let entropy = 0; // sampled neighborhood entropy

    // --- Energy & Age maps ---
    let energyMap = new Float32Array(cellCount);
    let ageMap = new Uint16Array(cellCount);
    // --- Sistema de especies/razas ---
    let speciesMap = new Uint8Array(cellCount); // 0=neutro, 1-7=especies con DNA único
    let allianceMap = new Uint8Array(cellCount); // 0=neutral, 1-3=alianzas
    let weaponGrid = new Uint8Array(cellCount); // 0=normal, 1=factory, 2=weapon, 3=nuke
    const idx = (r: number, c: number) => r * cols + c;

    // Reaction-Diffusion state
    let chemoA = new Float32Array(cellCount);
    let chemoB = new Float32Array(cellCount);
    let chemoA2 = new Float32Array(cellCount);
    let chemoB2 = new Float32Array(cellCount);

    // Precomputed neighbor coordinates (row,col pairs) for fast counting (no wormhole)
    const neighborMap: Uint16Array[][] = Array.from({length: rows}, (_, r) =>
      Array.from({length: cols}, (_, c) => {
        const arr = new Uint16Array(16); // 8 vecinos * (r,c)
        let p = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            arr[p++] = (r + dr + rows) % rows;
            arr[p++] = (c + dc + cols) % cols;
          }
        }
        return arr;
      })
    );

    // --- Event System ---
    type AstroEventType =
      | 'SOLAR_FLARE'
      | 'COMET'
      | 'SUPERNOVA'
      | 'NEBULA'
      | 'GRAVITATIONAL_WAVE'
      | 'BLACK_HOLE'
      | 'QUASAR'
      | 'DARK_MATTER'
      | 'COSMIC_STRINGS'
      | 'PULSAR'
      | 'WORMHOLE'
      | 'ANCESTRAL_ECHO'
      | 'GLIDER_STORM'
      | 'AURORA'
      | 'TIME_DILATION'
      | 'METEOR_SHOWER'
      | 'PHOTON_BURST'
      | 'SINGULARITY'
      | 'INVASION' // new war event
      | 'GALACTIC_WAR' // Guerra épica entre clústeres
      | 'SPECIES_EVOLUTION' // Evolución genética automática
      | 'NUCLEAR_WARFARE'; // Armas de destrucción masiva
    interface AstroEvent { type: AstroEventType; startGen: number; endGen: number; meta?: any; }
    const activeEvents: AstroEvent[] = [];
    const isEventActive = (t: AstroEventType) => activeEvents.some(e => generation >= e.startGen && generation <= e.endGen && e.type === t);
    const getEvent = (t: AstroEventType) => activeEvents.find(e => generation >= e.startGen && generation <= e.endGen && e.type === t);
    const pruneEvents = () => { for (let i = activeEvents.length - 1; i >= 0; i--) if (generation > activeEvents[i].endGen) activeEvents.splice(i,1); };
    const spawnEvent = (type: AstroEventType) => {
      switch(type) {
        case 'SOLAR_FLARE': activeEvents.push({ type, startGen: generation, endGen: generation + 80 }); if(!extralifeOnlyInvasion){ for (let k=0;k<200;k++){ const r=Math.floor(Math.random()*rows); const c=Math.floor(Math.random()*cols); if(Math.random()>0.5) currentGeneration[r][c]=1; } } break;
        case 'COMET': { const dir=Math.random()>0.5?'H':'V'; activeEvents.push({ type,startGen:generation,endGen:generation+120,meta:{dir}}); if(!extralifeOnlyInvasion){ for(let k=0;k<6;k++){ if(dir==='H') addGlider(2,Math.floor(Math.random()*rows)); else addGlider(Math.floor(Math.random()*cols),2);} } break; }
        case 'SUPERNOVA': { const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); const radius=15+Math.floor(Math.random()*10); activeEvents.push({type,startGen:generation,endGen:generation+50,meta:{cx,cy,radius}}); circularOp(cx,cy,radius,(r,c)=>currentGeneration[r][c]=0); if(!extralifeOnlyInvasion){ circularOp(cx,cy,radius+2,(r,c)=>{ if(Math.random()>0.7) currentGeneration[r][c]=1;}); } break; }
        case 'NEBULA': { activeEvents.push({type,startGen:generation,endGen:generation+150}); if(!extralifeOnlyInvasion){ for(let n=0;n<5;n++){ const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); const radius=8+Math.floor(Math.random()*6); circularOp(cx,cy,radius,(r,c)=>{ if(Math.random()>0.4) currentGeneration[r][c]=1;}); } } break; }
        case 'GRAVITATIONAL_WAVE': activeEvents.push({type,startGen:generation,endGen:generation+200}); break;
        case 'BLACK_HOLE': { const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); activeEvents.push({type,startGen:generation,endGen:generation+600,meta:{cx,cy,baseRadius:6}}); break; }
        case 'QUASAR': { const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); const angle=Math.random()*Math.PI*2; activeEvents.push({type,startGen:generation,endGen:generation+120,meta:{cx,cy,angle}}); break; }
        case 'DARK_MATTER': { const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); const radius=10+Math.floor(Math.random()*12); activeEvents.push({type,startGen:generation,endGen:generation+400,meta:{cx,cy,radius}}); break; }
        case 'COSMIC_STRINGS': { const lines: {a:number;b:number;vertical:boolean}[]=[]; const cnt=2+Math.floor(Math.random()*3); for(let i=0;i<cnt;i++){ const vertical=Math.random()>0.5; if(vertical) lines.push({a:Math.floor(Math.random()*cols),b:0,vertical}); else lines.push({a:0,b:Math.floor(Math.random()*rows),vertical}); } activeEvents.push({type,startGen:generation,endGen:generation+300,meta:{lines}}); break; }
        case 'PULSAR': { const period=40+Math.floor(Math.random()*30); activeEvents.push({type,startGen:generation,endGen:generation+500,meta:{period}}); break; }
        case 'WORMHOLE': { const shiftSpeed=0.3+Math.random()*0.7; const spin=(Math.random()>0.5?1:-1)*(0.2+Math.random()*0.6); activeEvents.push({type,startGen:generation,endGen:generation+260,meta:{shiftSpeed,spin}}); break; }
        case 'ANCESTRAL_ECHO': activeEvents.push({type,startGen:generation,endGen:generation+140}); break;
        case 'GLIDER_STORM': activeEvents.push({type,startGen:generation,endGen:generation+300}); break;
        case 'AURORA': { const bandCount=3+Math.floor(Math.random()*4); const speed=0.3+Math.random()*0.4; activeEvents.push({type,startGen:generation,endGen:generation+400,meta:{bandCount,speed}}); break; }
        case 'TIME_DILATION': { const factor=1.4+Math.random()*0.8; activeEvents.push({type,startGen:generation,endGen:generation+500,meta:{factor}}); break; }
        case 'METEOR_SHOWER': { const trails=[...Array(10)].map(()=>({x:Math.random()*cols,y:Math.random()*rows,vx:0.5+Math.random(),vy:0.5+Math.random()})); activeEvents.push({type,startGen:generation,endGen:generation+180,meta:{trails}}); break; }
        case 'PHOTON_BURST': activeEvents.push({type,startGen:generation,endGen:generation+120}); break;
        case 'SINGULARITY': { const cx=Math.floor(Math.random()*cols); const cy=Math.floor(Math.random()*rows); activeEvents.push({type,startGen:generation,endGen:generation+260,meta:{cx,cy}}); break; }
        case 'INVASION': { // seed invader colonies along edges & random interior
          activeEvents.push({type,startGen:generation,endGen:generation+500,meta:{}});
          for(let k=0;k<12;k++){
            const side=Math.floor(Math.random()*4);
            let r=Math.floor(Math.random()*rows); let c=Math.floor(Math.random()*cols);
            if(side===0) r=0; else if(side===1) r=rows-1; else if(side===2) c=0; else c=cols-1;
            for(let dy=0;dy<4;dy++) for(let dx=0;dx<4;dx++){ const rr=(r+dy)%rows; const cc=(c+dx)%cols; invaderGrid[rr][cc]=1; }
          }
          break; }
        case 'GALACTIC_WAR': { // Guerra épica entre los 2 clústeres más grandes
          // Detectar clústeres para guerra
          const visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));
          const clusters: {x:number;y:number;w:number;h:number;size:number}[] = [];
          for(let r=0;r<rows;r++){
            for(let c=0;c<cols;c++){
              if(!currentGeneration[r][c] || visited[r][c]) continue;
              let minR=r,maxR=r,minC=c,maxC=c,size=0;
              const q:number[][]=[[r,c]]; visited[r][c]=true;
              while(q.length && size<4000){ const [rr,cc]=q.shift()!; size++; for(let dr=-1;dr<=1;dr++){ for(let dc=-1;dc<=1;dc++){ if(dr===0&&dc===0) continue; const nr=(rr+dr+rows)%rows; const nc=(cc+dc+cols)%cols; if(!visited[nr][nc] && currentGeneration[nr][nc]){ visited[nr][nc]=true; q.push([nr,nc]); if(nr<minR)minR=nr; if(nr>maxR)maxR=nr; if(nc<minC)minC=nc; if(nc>maxC)maxC=nc; } } } }
              clusters.push({x:minC,y:minR,w:maxC-minC+1,h:maxR-minR+1,size});
              if(clusters.length>20) break;
            }
            if(clusters.length>20) break;
          }
          clusters.sort((a,b)=>b.size-a.size);
          const fronts: {x:number;y:number}[] = [];
          if(clusters.length>=2){
            const c1={x:clusters[0].x+clusters[0].w/2, y:clusters[0].y+clusters[0].h/2};
            const c2={x:clusters[1].x+clusters[1].w/2, y:clusters[1].y+clusters[1].h/2};
            const steps=Math.floor(Math.sqrt((c2.x-c1.x)**2 + (c2.y-c1.y)**2))*2;
            for(let i=0;i<=steps;i++) fronts.push({x:c1.x + (c2.x-c1.x)*i/steps, y:c1.y + (c2.y-c1.y)*i/steps});
          }
          activeEvents.push({type,startGen:generation,endGen:generation+250,meta:{fronts,clusters:clusters.slice(0,2)}});
          break; }
        case 'SPECIES_EVOLUTION': { // Evolución genética de especies
          // Asignar DNA aleatorio a células vivas
          let speciesAssigned = 0;
          for(let r=0;r<rows;r++) {
            for(let c=0;c<cols;c++) {
              if(currentGeneration[r][c]) {
                const i=idx(r,c);
                if(speciesMap[i] === 0) { // Si no tiene especie asignada
                  speciesMap[i] = 1 + Math.floor(Math.random() * 7); // DNA 1-7
                  speciesAssigned++;
                }
              }
            }
          }
          console.log(`🧬 SPECIES_EVOLUTION: Assigned species to ${speciesAssigned} cells`);
          activeEvents.push({type,startGen:generation,endGen:generation+1200,meta:{}});
          break; }
        case 'NUCLEAR_WARFARE': { // Desarrollo de armas nucleares
          // Buscar civilizaciones avanzadas (edad > 50) para crear fábricas de armas
          let factoriesCreated = 0;
          for(let r=0;r<rows;r++) {
            for(let c=0;c<cols;c++) {
              if(currentGeneration[r][c]) {
                const i=idx(r,c);
                if(ageMap[i] > 50 && Math.random() < 0.01) { // 1% de células antiguas se vuelven fábricas
                  weaponGrid[i] = 1; // Factory
                  factoriesCreated++;
                }
              }
            }
          }
          console.log(`☢️ NUCLEAR_WARFARE: Created ${factoriesCreated} weapon factories`);
          activeEvents.push({type,startGen:generation,endGen:generation+600,meta:{}});
          break; }
      }
    };

    // --- Event cooldown registry to avoid over-saturation ---
    const lastEventGen: Record<string, number> = {};
    const spawnEventCool = (type: AstroEventType, cooldown: number, probability = 1) => {
      if (Math.random() > probability) return;
      const last = lastEventGen[type] ?? -Infinity;
      if (generation - last < cooldown) return;
      spawnEvent(type);
      lastEventGen[type] = generation;
    };

    // Patterns and archetypes
    const placePattern = (top: number,left: number,pattern: number[][]) => { for(let r=0;r<pattern.length;r++) for(let c=0;c<pattern[r].length;c++) if(pattern[r][c]){ const rr=(top+r+rows)%rows; const cc=(left+c+cols)%cols; currentGeneration[rr][cc]=1; } };
    const GOSPER_GLIDER_GUN: number[][] = Array.from({length:10},()=>Array(36).fill(0));
    (()=>{ const coords=[[5,1],[5,2],[6,1],[6,2],[5,11],[6,11],[7,11],[4,12],[8,12],[3,13],[9,13],[3,14],[9,14],[6,15],[4,16],[8,16],[5,17],[6,17],[7,17],[6,18],[3,21],[4,21],[5,21],[3,22],[4,22],[5,22],[2,23],[6,23],[1,25],[2,25],[6,25],[7,25],[3,35],[4,35],[3,36],[4,36]]; for(const [r,c] of coords) GOSPER_GLIDER_GUN[r][c]=1; })();
    const PULSAR_PATTERN: number[][] = [ [0,0,1,1,1,0,0,0,1,1,1,0],[0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,1,0,1,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,1],[0,0,1,1,1,0,0,0,1,1,1,0] ];
    const LWSS: number[][] = [ [0,1,1,1,1],[1,0,0,0,1],[0,0,0,0,1],[1,0,0,1,0] ];

    const archetypeInjection = () => {
      // Compute diversity signature cheaply (reuse entropy already, but add distinct neighborhood metric)
      const diversity = sampleNeighborhoodSignature(currentGeneration, 120).distinct; // 0..9 approx
      // Low entropy & low diversity: inject a rare complex seed (gun / pulsar) to stimulate growth
      if (entropy < 2.1 && diversity < 4 && Math.random() < 0.18) {
        const pat = PATTERNS.find(p=>p.name.includes('Gun')) || pickPatternByRarity(0.4);
        const top = Math.floor(Math.random()*rows*0.5);
        const left = Math.floor(Math.random()*cols*0.5);
        stampPattern(currentGeneration, pat, top, left);
      }
      // Mid energy band: orchestrate multiple medium patterns
      if (averageEnergy > 1 && averageEnergy < 4 && Math.random() < 0.12) {
        for (let k=0;k<2+Math.floor(Math.random()*2);k++) {
          const pat = pickPatternByRarity();
          stampPattern(currentGeneration, pat, Math.floor(Math.random()*rows), Math.floor(Math.random()*cols));
        }
      }
      // High entropy bursts: lightweight ships to spread frontier patterns
      if (entropy > 3.25 && Math.random() < 0.16) {
        const fleet = PATTERNS.filter(p=>p.name.includes('LWSS'));
        for (let k=0;k< (3+Math.floor(Math.random()*5)); k++) {
          const pat = fleet[0] || pickPatternByRarity();
          stampPattern(currentGeneration, pat, Math.floor(Math.random()*rows), Math.floor(Math.random()*cols));
        }
      }
      // Occasionally spiral or nova seeds for aesthetic variance
      if (Math.random() < 0.05 && entropy > 2 && entropy < 3.2) {
        const ornamental = PATTERNS.find(p=>p.name==='SpiralSeed') || pickPatternByRarity();
        stampPattern(currentGeneration, ornamental, Math.floor(Math.random()*rows), Math.floor(Math.random()*cols));
      }
    };

    // Compressed history (single implementation)
    const HISTORY_CAP = 64; const history: Uint8Array[] = []; const HISTORY_DIFF_THRESHOLD = 0.02;
    const pushHistory = () => {
      if (!currentGeneration.length) return;
      // Comparar con último frame para compresión adaptativa
      if (history.length) {
        const last = history[history.length-1];
        let diff=0;
        for (let r=0;r<rows;r++) {
          const rowArr = currentGeneration[r];
            for (let c=0;c<cols;c++) {
              if (rowArr[c] !== last[idx(r,c)]) diff++;
            }
        }
        const ratio = diff / cellCount;
        if (ratio < HISTORY_DIFF_THRESHOLD && generation % 25 !== 0) return; // no guardar frame similar salvo cada 25 gens
      }
      const frame=new Uint8Array(cellCount);
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) frame[idx(r,c)]=currentGeneration[r][c];
      history.push(frame); if(history.length>HISTORY_CAP) history.shift();
    };

    // Inicializar especies para todas las células vivas
    const initSpecies = () => {
      console.log('🧬 Initializing species for all living cells...');
      let assigned = 0;
      for(let r=0;r<rows;r++) {
        for(let c=0;c<cols;c++) {
          if(currentGeneration[r][c]) {
            const i=idx(r,c);
            speciesMap[i] = 1 + Math.floor(Math.random() * 7); // DNA 1-7
            allianceMap[i] = Math.floor((speciesMap[i]-1) / 2) + 1; // 3 alianzas
            assigned++;
          }
        }
      }
      console.log(`🧬 Assigned species to ${assigned} initial cells`);
      // Contar especies por tipo
      const speciesCounts = [0,0,0,0,0,0,0,0];
      for(let i=0; i<cellCount; i++) {
        if(speciesMap[i] > 0) speciesCounts[speciesMap[i]]++;
      }
      console.log(`🧬 Species distribution:`, speciesCounts.slice(1));
    };

    // Chemistry init con distribución más rica para eternidad
    const initChemistry = () => { 
      for(let i=0;i<cellCount;i++){ chemoA[i]=1; chemoB[i]=0; } 
      // Múltiples focos químicos para diversidad eterna
      for(let k=0;k<35;k++){ 
        const r=Math.floor(Math.random()*rows); 
        const c=Math.floor(Math.random()*cols); 
        const rad=3+Math.floor(Math.random()*8); 
        const intensity = 0.4 + Math.random()*0.4; // variedad de intensidades
        for(let y=-rad;y<=rad;y++){ 
          for(let x=-rad;x<=rad;x++){ 
            if(x*x+y*y<=rad*rad){ 
              const rr=(r+y+rows)%rows; 
              const cc=(c+x+cols)%cols; 
              chemoB[idx(rr,cc)]=intensity; 
            } 
          } 
        } 
      } 
    };
    const updateChemistry = () => { const feed=0.035, kill=0.062, Da=1.0, Db=0.5; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ const id=idx(r,c); const a=chemoA[id]; const b=chemoB[id]; let sumA=0,sumB=0; for(let dr=-1;dr<=1;dr++){ for(let dc=-1;dc<=1;dc++){ if(dr===0&&dc===0) continue; const rr=(r+dr+rows)%rows; const cc=(c+dc+cols)%cols; const nid=idx(rr,cc); const w=(dr===0||dc===0)?1:0.5; sumA+=chemoA[nid]*w; sumB+=chemoB[nid]*w; } } const lapA=sumA - a*(4+4*0.5); const lapB=sumB - b*(4+4*0.5); const reaction=a*b*b; const newA=a+(Da*lapA - reaction + feed*(1-a))*0.08; const newB=b+(Db*lapB + reaction - (kill+feed)*b)*0.08; chemoA2[id]=Math.min(1,Math.max(0,newA)); chemoB2[id]=Math.min(1,Math.max(0,newB)); } } [chemoA,chemoA2]=[chemoA2,chemoA]; [chemoB,chemoB2]=[chemoB2,chemoB]; };

    // Entropy sampling
    const computeEntropy = () => { const buckets=new Uint32Array(10); const samples=400; for(let s=0;s<samples;s++){ const r=Math.floor(Math.random()*rows); const c=Math.floor(Math.random()*cols); let cnt=0; for(let i=-1;i<=1;i++){ for(let j=-1;j<=1;j++){ const rr=(r+i+rows)%rows; const cc=(c+j+cols)%cols; cnt+=currentGeneration[rr][cc]; } } buckets[cnt]++; } let H=0; for(let k=0;k<buckets.length;k++){ if(!buckets[k]) continue; const p=buckets[k]/samples; H-=p*Math.log2(p); } entropy=H; };

    const addGlider = (gx:number, gy:number) => { const pattern=[[0,1,0],[0,0,1],[1,1,1]]; for(let r=0;r<pattern.length;r++){ for(let c=0;c<pattern[0].length;c++){ if(pattern[r][c]){ const rr=(gy+r+rows)%rows; const cc=(gx+c+cols)%cols; currentGeneration[rr][cc]=1; } } } };
    const circularOp = (cx:number, cy:number, radius:number, fn:(r:number,c:number)=>void) => { const r2=radius*radius; for(let y=-radius;y<=radius;y++){ for(let x=-radius;x<=radius;x++){ if(x*x+y*y<=r2){ const rr=(cy+y+rows)%rows; const cc=(cx+x+cols)%cols; fn(rr,cc); } } } };

    const countNeighbors = (row:number,col:number):number => {
      const wormhole = getEvent('WORMHOLE');
      // Fast path: no wormhole distortion → use precomputed neighbor map
      if (!wormhole) {
        const list = neighborMap[row][col];
        let sum = 0;
        // 16 entries = 8 (r,c) pairs
        for (let k=0;k<16;k+=2) sum += currentGeneration[list[k]][list[k+1]];
        return sum;
      }
      // Distorted path (no per-neighbor mutation of offsets; derive deterministic offsets from generation)
      const { shiftSpeed, spin } = wormhole.meta;
      const offX = (generation * spin * 0.5) % cols;
      const offY = (generation * spin * 0.4) % rows;
      let count = 0;
      for (let dr=-1; dr<=1; dr++) {
        for (let dc=-1; dc<=1; dc++) {
          if (dr===0 && dc===0) continue;
          let nr = (row + dr + rows) % rows;
          let nc = (col + dc + cols) % cols;
          nr = (nr + Math.floor(offY + Math.sin((nc + generation*shiftSpeed)*0.02)*2) + rows) % rows;
          nc = (nc + Math.floor(offX + Math.cos((nr + generation*shiftSpeed)*0.02)*2) + cols) % cols;
          count += currentGeneration[nr][nc];
        }
      }
      return count;
    };

    // --- Core update ---
    const updateGeneration = () => {
      if (extinct) return; // universo congelado hasta reinicio manual
      // Update chemistry less frequently for performance
      if (generation % 2 === 0) updateChemistry();
      computeEntropy();
      const invasion = getEvent('INVASION');
      const allowCosmicBirth = !extralifeOnlyInvasion || !!invasion; // solo se permiten nacimientos de eventos si invasión activa

      const solarFlareActive = isEventActive('SOLAR_FLARE');
      const gravWaveActive = isEventActive('GRAVITATIONAL_WAVE');
      const nebulaActive = isEventActive('NEBULA');
      const cometActive = isEventActive('COMET');
      const supernovaActive = isEventActive('SUPERNOVA');
      const blackHole = getEvent('BLACK_HOLE');
      const quasar = getEvent('QUASAR');
      const darkMatter = getEvent('DARK_MATTER');
      const cosmicStrings = getEvent('COSMIC_STRINGS');
      const pulsar = getEvent('PULSAR');
      const gliderStorm = getEvent('GLIDER_STORM');
      const aurora = getEvent('AURORA');
      const galacticWar = getEvent('GALACTIC_WAR');
      const speciesEvolution = getEvent('SPECIES_EVOLUTION');
      const nuclearWarfare = getEvent('NUCLEAR_WARFARE');

      // Base rule sets (start from Conway)
      const survivalBase = new Set([2,3]);
      const birthBase = new Set([3]);

      // Adaptive morphing by entropy & energy
      if (entropy < 2) birthBase.add(2);
      if (entropy > 3.2 && Math.random() < 0.5) birthBase.delete(3);
      if (averageEnergy > 6.5) survivalBase.add(4);
      if (gravWaveActive) { survivalBase.add(4); birthBase.add(6); }
      if (nebulaActive) birthBase.add(2);

      let mutationProb = 0.002;
      if (!allowCosmicBirth) mutationProb = 0; // bloqueo de mutaciones que podrían reanimar
      if (solarFlareActive && allowCosmicBirth) mutationProb = 0.02;
      if (cometActive && allowCosmicBirth) mutationProb *= 1.5;
      if (pulsar && allowCosmicBirth) { const {period}=pulsar.meta; if((generation - pulsar.startGen) % period < period*0.25) mutationProb *=4; }

  let liveCount=0; let totalEnergy=0;
      for(let row=0; row<rows; row++){
        for(let col=0; col<cols; col++){
          const neighbors = countNeighbors(row,col);
          const currentCell = currentGeneration[row][col];
          let localSurvival = survivalBase; let localBirth = birthBase;
          if (darkMatter) { const {cx,cy,radius}=darkMatter.meta; const dx=(col-cx+cols)%cols; const dy=(row-cy+rows)%rows; const dist=Math.sqrt(dx*dx+dy*dy); if(dist<radius){ localSurvival=new Set(localSurvival); localBirth=new Set(localBirth); localSurvival.add(1); localBirth.add(4);} }
          const chemId=idx(row,col); const a=chemoA[chemId]; const b=chemoB[chemId];
          if (b>0.55 && allowCosmicBirth) localBirth = new Set([...localBirth,2]);
          if (a>0.9 && neighbors>3) localSurvival = new Set([...localSurvival].filter(v=>v<4));
          let nextState = currentCell===1 ? (localSurvival.has(neighbors)?1:0) : (localBirth.has(neighbors)?1:0);
          if (aurora && allowCosmicBirth && row < rows*0.15 && currentCell===0) { if((neighbors===2||neighbors===3)&&Math.random()<0.02) nextState=1; }
          if (gliderStorm && allowCosmicBirth && currentCell===0 && (row<3||col<3||row>rows-4||col>cols-4)) { if(neighbors===3 && Math.random()<0.25) nextState=1; }
          if (supernovaActive && allowCosmicBirth){ const event=getEvent('SUPERNOVA'); if(event){ const {cx,cy,radius}=event.meta; const dx=(col-cx+cols)%cols; const dy=(row-cy+rows)%rows; const dist=Math.sqrt(dx*dx+dy*dy); if(dist>radius && dist<radius+4 && Math.random()<0.05) nextState=1; }}
          if (blackHole && allowCosmicBirth){ const {cx,cy,baseRadius}=blackHole.meta; const ageBH=generation - blackHole.startGen; const radius=baseRadius + Math.min(40, ageBH*0.05); const dx=(col-cx+cols)%cols; const dy=(row-cy+rows)%rows; const dist=Math.sqrt(dx*dx+dy*dy); if(dist>=radius && dist<radius+2 && Math.random()<0.05) nextState=1; if(dist<radius && Math.random()<0.7) nextState=0; }
          if (quasar && allowCosmicBirth){ const {cx,cy,angle}=quasar.meta; const dx=(col-cx+cols)%cols - cols/2; const dy=(row-cy+rows)%rows - rows/2; const dist=Math.sqrt(dx*dx+dy*dy); if(dist>4){ const aAngle=Math.atan2(dy,dx); let d=Math.abs(aAngle-angle); d=Math.min(d,Math.PI*2-d); if(d<0.06 && Math.random()<0.3) nextState=1; else if(d<0.12 && Math.random()<0.08) nextState=1; }}
          if (cosmicStrings && allowCosmicBirth){ const {lines}=cosmicStrings.meta; for(const line of lines){ if(line.vertical){ if(col===line.a && Math.random()<0.02) nextState=1; } else { if(row===line.b && Math.random()<0.02) nextState=1; } } }
          
          // Guerra galáctica: destrucción masiva en frentes de batalla
          if (galacticWar) {
            const {fronts} = galacticWar.meta;
            for(const f of fronts) {
              const dist = Math.sqrt((col-f.x)**2 + (row-f.y)**2);
              if(dist < 3) {
                if(Math.random()<0.65) nextState=0; // destrucción en frente
                else if(currentCell===0 && Math.random()<0.12) nextState=1; // chispas de guerra
              }
            }
          }
          if (!allowCosmicBirth && currentCell===0 && nextState===1) nextState=0; // impedir nacimiento no autorizado
          if (mutationProb>0 && Math.random()<mutationProb) nextState = 1 - nextState;

          // War mode influence: invaders suppress births and convert
          if (warMode) {
            const inv = invaderGrid[row][col];
            if (inv === 1) {
              // Invader present: 40% chance to extinguish host life
              if (currentCell === 1 && Math.random() < 0.4) nextState = 0;
            } else if (invasion) {
              // During active invasion event, if adjacent invader cluster >1, reduce birth probability
              let invN=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(dx||dy){ const rr=(row+dy+rows)%rows; const cc=(col+dx+cols)%cols; invN += invaderGrid[rr][cc]; } }
              if (invN>=2 && nextState===1 && Math.random()<0.3) nextState=0; // suppression
            }
          }

          // === SISTEMAS AVANZADOS DE ESPECIES Y ARMAMENTO ===
          const i = idx(row, col);
          
          // HERENCIA DE ESPECIES: SIEMPRE asignar especie a células nuevas
          if(nextState === 1 && currentCell === 0) { // Nueva célula que nace
            // Buscar especie dominante en vecindario
            const neighborSpecies = [0,0,0,0,0,0,0,0]; // count por especie 1-7
            for(let dy=-1;dy<=1;dy++) {
              for(let dx=-1;dx<=1;dx++) {
                if(dx || dy) {
                  const rr=(row+dy+rows)%rows, cc=(col+dx+cols)%cols;
                  const specIdx = idx(rr,cc);
                  if(currentGeneration[rr][cc] && speciesMap[specIdx] > 0) {
                    neighborSpecies[speciesMap[specIdx]-1]++;
                  }
                }
              }
            }
            const maxCount = Math.max(...neighborSpecies);
            if(maxCount > 0) {
              const dominantSpecies = neighborSpecies.indexOf(maxCount) + 1;
              speciesMap[i] = dominantSpecies;
              allianceMap[i] = Math.floor((dominantSpecies-1) / 2) + 1;
            } else {
              // Si no hay vecinos con especies, asignar especie aleatoria
              speciesMap[i] = 1 + Math.floor(Math.random() * 7);
              allianceMap[i] = Math.floor((speciesMap[i]-1) / 2) + 1;
            }
          }
          
          // Sistema de evolución genética - preservar especies
          if (speciesEvolution && currentCell === 1) {
            // Reproducción preserva especie dominante en vecindario
            let dominantSpecies = speciesMap[i];
            if (dominantSpecies === 0) {
              const neighborSpecies = [0,0,0,0,0,0,0,0]; // count por especie 1-7
              for(let dy=-1;dy<=1;dy++) {
                for(let dx=-1;dx<=1;dx++) {
                  if(dx || dy) {
                    const rr=(row+dy+rows)%rows, cc=(col+dx+cols)%cols;
                    const specIdx = idx(rr,cc);
                    if(currentGeneration[rr][cc] && speciesMap[specIdx] > 0) {
                      neighborSpecies[speciesMap[specIdx]-1]++;
                    }
                  }
                }
              }
              const maxCount = Math.max(...neighborSpecies);
              if(maxCount > 0) {
                dominantSpecies = neighborSpecies.indexOf(maxCount) + 1;
              }
            }
            
            // Alianzas entre especies similares (DNA ±1)
            if(dominantSpecies > 0) {
              speciesMap[i] = dominantSpecies;
              allianceMap[i] = Math.floor((dominantSpecies-1) / 2) + 1; // 3 alianzas: {1,2}, {3,4}, {5,6,7}
            }
          }
          
          // Sistema de armamento nuclear
          if (nuclearWarfare) {
            // Fábricas desarrollan armas cada 10 generaciones
            if(weaponGrid[i] === 1 && generation % 10 === 0 && Math.random() < 0.3) {
              weaponGrid[i] = 2; // Factory → Weapon
              console.log(`🔫 Factory upgraded to weapon at (${row},${col})`);
            }
            // Armas se convierten en nukes si hay 3+ armas vecinas
            if(weaponGrid[i] === 2) {
              let weaponNeighbors = 0;
              for(let dy=-2;dy<=2;dy++) {
                for(let dx=-2;dx<=2;dx++) {
                  if(dx || dy) {
                    const rr=(row+dy+rows)%rows, cc=(col+dx+cols)%cols;
                    const weapIdx = idx(rr,cc);
                    if(weaponGrid[weapIdx] >= 2) weaponNeighbors++;
                  }
                }
              }
              if(weaponNeighbors >= 3 && Math.random() < 0.05) {
                weaponGrid[i] = 3; // Weapon → Nuke
                console.log(`☢️ Nuclear weapon created at (${row},${col})!`);
              }
            }
            
            // Nukes causan devastación masiva
            if(weaponGrid[i] === 3 && Math.random() < 0.02) {
              console.log(`💥 NUCLEAR EXPLOSION at (${row},${col})!`);
              // Explosión nuclear - devastar área 7x7
              for(let dy=-3;dy<=3;dy++) {
                for(let dx=-3;dx<=3;dx++) {
                  const rr=(row+dy+rows)%rows, cc=(col+dx+cols)%cols;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  if(dist <= 3) {
                    nextGeneration[rr][cc] = 0; // Muerte total
                    const nukeIdx = idx(rr,cc);
                    weaponGrid[nukeIdx] = 0; // Destruir armas
                    energyMap[nukeIdx] = 0; // Reset energía
                    ageMap[nukeIdx] = 0; // Reset edad
                  }
                }
              }
              weaponGrid[i] = 0; // Nuke se autodestruye
            }
          }

          // Guerra galáctica con especies aliadas
          if (galacticWar?.meta?.fronts) {
            const fronts = galacticWar.meta.fronts;
            for(const f of fronts) {
              const dist = Math.sqrt((col-f.x)**2 + (row-f.y)**2);
              if(dist < 3) {
                // Especies aliadas cooperan en guerra
                const mySpecies = speciesMap[i];
                const myAlliance = allianceMap[i];
                let hasAllies = false;
                
                if(myAlliance > 0) {
                  for(let dy=-1;dy<=1;dy++) {
                    for(let dx=-1;dx<=1;dx++) {
                      if(dx || dy) {
                        const rr=(row+dy+rows)%rows, cc=(col+dx+cols)%cols;
                        const allyIdx = idx(rr,cc);
                        if(currentGeneration[rr][cc] && allianceMap[allyIdx] === myAlliance) {
                          hasAllies = true;
                          break;
                        }
                      }
                    }
                    if(hasAllies) break;
                  }
                }
                
                if(hasAllies) {
                  // Con aliados, 40% supervivencia vs 65% muerte normal
                  if(Math.random()<0.4) nextState=0;
                } else {
                  // Sin aliados, muerte normal 65%
                  if(Math.random()<0.65) nextState=0;
                }
                
                if(currentCell===0 && Math.random()<0.12) nextState=1; // chispas de guerra
              }
            }
          }

          nextGeneration[row][col]=nextState;
          // Age / Energy
          if (nextState===1){ ageMap[chemId] = currentCell===1 ? (ageMap[chemId] < 60000 ? ageMap[chemId]+1 : ageMap[chemId]) : 1; } else { ageMap[chemId]=0; }
          const prevE=energyMap[chemId]; const ageFactor=ageMap[chemId]>120?0.4:1; const newE = nextState===1 ? Math.min(10, prevE + 0.6*ageFactor) : Math.max(0, prevE - 0.15); energyMap[chemId]=newE; totalEnergy+=newE; if(nextState===1) liveCount++;
        }
      }

      // --- Invader propagation phase ---
      if (warMode) {
        for(let r=0;r<rows;r++){
          for(let c=0;c<cols;c++){
            const curInv = invaderGrid[r][c];
            let invN=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(dx||dy){ const rr=(r+dy+rows)%rows; const cc=(c+dx+cols)%cols; invN += invaderGrid[rr][cc]; } }
            let nextInv = curInv;
            if (curInv===1){
              // Persistence with slight decay
              if (Math.random()<0.02) nextInv=0;
              // Expansion into adjacent non-invaded life cells
              if (Math.random()<0.3) {
                const rr=(r + (Math.random()>0.5?1:-1) + rows)%rows;
                const cc=(c + (Math.random()>0.5?1:-1) + cols)%cols;
                if (nextGeneration[rr][cc]===1) nextInvaderGrid[rr][cc]=1;
              }
            } else {
              // Birth of invader if surrounded by cluster (spread)
              if (invN>=3 && Math.random()<0.28) nextInv=1;
            }
            nextInvaderGrid[r][c] = nextInvInvSafe(nextInvaderGrid[r][c], nextInv);
          }
        }
        // Fill any untouched cells
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(nextInvaderGrid[r][c]===undefined) nextInvaderGrid[r][c]=invaderGrid[r][c];
      }

      [currentGeneration,nextGeneration]=[nextGeneration,currentGeneration];
      if (warMode) [invaderGrid,nextInvaderGrid]=[nextInvaderGrid,invaderGrid];

      // Detectar extinción total (tras al menos 1 generación para evitar caso inicial vacío)
      if (liveCount===0 && generation>0) {
        // Último recurso: química espontánea antes de extinción final
        let rescued = false;
        if (!extralifeOnlyInvasion && Math.random() < 0.3) {
          for(let attempt=0; attempt<8; attempt++) {
            const r = Math.floor(Math.random()*rows);
            const c = Math.floor(Math.random()*cols);
            const chemId = idx(r,c);
            if(chemoB[chemId] > 0.6) {
              currentGeneration[r][c] = 1;
              energyMap[chemId] = 2;
              ageMap[chemId] = 1;
              rescued = true;
            }
          }
        }
        if (!rescued) {
          setExtinct(true);
          activeEvents.length = 0; // limpiar eventos
          pushHistory();
          return; // no avanzar más generaciones automáticamente
        }
      }

      pushHistory();
      generation++;
      pruneEvents();

      // Scheduled (retain, but no forced revival on death)
      if (generation % 1800 === 0) spawnEventCool('GRAVITATIONAL_WAVE', 1200);
      if (generation % 1200 === 0) spawnEventCool('SOLAR_FLARE', 800);
      if (generation % 900 === 0) spawnEventCool('COMET', 700);
      if (generation % 1500 === 0) spawnEventCool('SUPERNOVA', 1400);

      // Eventos interdependientes (reaccionan entre sí para crear eternidad)
      spawnEventCool('NEBULA', 400, 0.0008 + (entropy > 3 ? 0.0004 : 0)); // más probable si hay caos
      spawnEventCool('SUPERNOVA', 1200, 0.0004 + (averageEnergy > 5 ? 0.0003 : 0)); // explota con mucha energía
      spawnEventCool('BLACK_HOLE', 1600, 0.00025 + (isEventActive('SUPERNOVA') ? 0.0008 : 0)); // tras supernovas
      spawnEventCool('QUASAR', 1000, 0.0003 + (isEventActive('BLACK_HOLE') ? 0.0006 : 0)); // cerca de agujeros negros
      spawnEventCool('DARK_MATTER', 900, 0.00025 + (liveCount < cellCount*0.1 ? 0.0005 : 0)); // en universo vacío
      spawnEventCool('COSMIC_STRINGS', 600, 0.00022 + (stagnationCounter > 100 ? 0.0004 : 0)); // rompe estancamiento
      spawnEventCool('PULSAR', 500, 0.00028 + (entropy < 1.5 ? 0.0003 : 0)); // estimula baja entropía
      spawnEventCool('WORMHOLE', 700, 0.0002 + (isEventActive('COSMIC_STRINGS') ? 0.0005 : 0)); // tras strings
      spawnEventCool('ANCESTRAL_ECHO', 500, 0.00024 + (history.length > 50 ? 0.0003 : 0)); // con historia rica
      spawnEventCool('GLIDER_STORM', 800, 0.00018 + (clustersRef.current.length < 3 ? 0.0004 : 0)); // pocos clústers
      spawnEventCool('AURORA', 600, 0.00022 + (isEventActive('PULSAR') ? 0.0002 : 0)); // con pulsares
      spawnEventCool('TIME_DILATION', 900, 0.00014 + (generation > 5000 ? 0.0002 : 0)); // universo maduro
      spawnEventCool('METEOR_SHOWER', 550, 0.00013 + (Math.abs(previousLiveCount - liveCount) > cellCount*0.05 ? 0.0003 : 0)); // cambios bruscos
      spawnEventCool('PHOTON_BURST', 350, 0.00012 + (isEventActive('AURORA') ? 0.0003 : 0)); // con auroras
      spawnEventCool('SINGULARITY', 1800, 0.00007 + (activeEvents.length > 8 ? 0.00015 : 0)); // múltiples eventos
      spawnEventCool('GALACTIC_WAR', 800, 0.0003 + (clustersRef.current.length >= 2 ? 0.0008 : 0)); // guerra entre clústeres grandes
      spawnEventCool('SPECIES_EVOLUTION', 1000, 0.0002 + (generation > 2000 ? 0.0005 : 0)); // evolución tras madurez
      spawnEventCool('NUCLEAR_WARFARE', 1200, 0.00015 + (liveCount > cellCount*0.3 ? 0.0004 : 0)); // civilizaciones densas desarrollan armas
      // Eliminado spawn automático de INVASION para respetar ciclo único. Solo usuario podrá reiniciar.      // Adaptive metrics (no forced reseed on stagnation/death now)
      if (previousLiveCount === liveCount) stagnationCounter++; else stagnationCounter=0; previousLiveCount=liveCount; averageEnergy = totalEnergy / cellCount;

  // Solo inyectar arquetipos si los nacimientos cósmicos están permitidos (invasión activa o modo libre)
  if (allowCosmicBirth) archetypeInjection();
    };

    // Helper to merge invader states (prefer alive invader)
    const nextInvInvSafe = (prev: number|undefined, next: number) => (next===1?1:(prev===1?1:next||0));

    // Init
    const initializeGrid = () => {
      currentGeneration = Array(rows).fill(null).map(()=>Array(cols).fill(0));
      nextGeneration = Array(rows).fill(null).map(()=>Array(cols).fill(0));
      invaderGrid = Array(rows).fill(null).map(()=>Array(cols).fill(0));
      nextInvaderGrid = Array(rows).fill(null).map(()=>Array(cols).fill(0));
      // Sólo una región inicial leve, sin parches aleatorios extensos
      for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ const centerX=cols/2; const centerY=rows/2; const dist=Math.sqrt((c-centerX)**2 + (r-centerY)**2); if(dist<18){ if(Math.random()>0.55) currentGeneration[r][c]=1; } } }
      energyMap.fill(0); ageMap.fill(0); speciesMap.fill(0); allianceMap.fill(0); weaponGrid.fill(0); 
      initChemistry();
      // INICIALIZAR ESPECIES DESDE EL PRINCIPIO
      initSpecies();
    };

    // Ghost layer
    interface Ripple { x:number; y:number; start:number; }
    const ripples:Ripple[]=[]; let ghostX=width/4; let ghostY=height/4; let lastPointerMove=performance.now(); const inactivityFadeAfter=3000; const rippleDuration=2000;
    const handleMove=(e:MouseEvent)=>{ const rect=canvas.getBoundingClientRect(); ghostX=e.clientX-rect.left; ghostY=e.clientY-rect.top; lastPointerMove=performance.now(); };
    const handleClick=(e:MouseEvent)=>{ const rect=canvas.getBoundingClientRect(); ripples.push({x:e.clientX-rect.left,y:e.clientY-rect.top,start:performance.now()}); };
    canvas.addEventListener('mousemove', handleMove); canvas.addEventListener('click', handleClick);

    let lastUpdate=0; const baseInterval=100;

    const animate = (timestamp:number) => {
      const timeDilation = getEvent('TIME_DILATION');
      const factor = timeDilation ? timeDilation.meta.factor : 1;
      if (timestamp - lastUpdate > baseInterval * factor) { updateGeneration(); lastUpdate = timestamp; }

      ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(0,0,width/2,height/2);
      const baseHueShift = (generation*0.05)%360;
      const solarFlareActive=isEventActive('SOLAR_FLARE'); const gravWaveActive=isEventActive('GRAVITATIONAL_WAVE'); const nebulaActive=isEventActive('NEBULA'); const darkMatter=getEvent('DARK_MATTER'); const blackHole=getEvent('BLACK_HOLE'); const quasar=getEvent('QUASAR'); const pulsar=getEvent('PULSAR'); const cosmicStrings=getEvent('COSMIC_STRINGS'); const wormhole=getEvent('WORMHOLE'); const gliderStorm=getEvent('GLIDER_STORM'); const aurora=getEvent('AURORA'); const meteor=getEvent('METEOR_SHOWER'); const photon=isEventActive('PHOTON_BURST'); const singularity=getEvent('SINGULARITY'); const ancestralEcho=isEventActive('ANCESTRAL_ECHO'); const invasion=isEventActive('INVASION'); const galacticWar=getEvent('GALACTIC_WAR');
      const driftX=Math.sin(generation*0.0007)*40; const driftY=Math.cos(generation*0.0005)*40;

      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          if(currentGeneration[r][c]===1){ 
            const x=c*cellSize+driftX*0.2; const y=r*cellSize+driftY*0.2; 
            let hue=(220+baseHueShift)%360; 
            
            // === COLORACIÓN POR ESPECIES ===
            const i = idx(r,c);
            const species = speciesMap[i];
            const alliance = allianceMap[i];
            const weapon = weaponGrid[i];
            
            // Hue base por especie (DNA único por raza)
            if(species > 0) {
              const speciesHues = [0, 60, 120, 180, 240, 300, 30, 270]; // Colores MÁS diferenciados
              hue = speciesHues[species] || hue;
              // Debug: Log para verificar que se están aplicando los colores
              if(r === 25 && c === 25 && generation % 60 === 0) {
                console.log(`🎨 Cell(${r},${c}) species=${species} hue=${hue}`);
              }
            } else {
              // Si no tiene especie, asignar una ahora mismo
              const newSpecies = 1 + Math.floor(Math.random() * 7);
              speciesMap[i] = newSpecies;
              allianceMap[i] = Math.floor((newSpecies-1) / 2) + 1;
              const speciesHues = [0, 60, 120, 180, 240, 300, 30, 270];
              hue = speciesHues[newSpecies] || hue;
            }
            
            if(solarFlareActive) hue=(hue+60)%360; 
            if(gravWaveActive) hue=(hue+Math.sin(generation*0.02)*40)%360; 
            if(nebulaActive) hue=(hue+Math.sin(r*0.3)*25)%360; 
            if(pulsar) hue=(hue+Math.sin(generation*0.4)*30)%360; 
            if(wormhole) hue=(hue+Math.sin((r+c+generation)*0.1)*50)%360; 
            if(gliderStorm) hue=(hue + (generation*2 + r*3 + c*5)*0.03)%360; 
            
            const aAge=ageMap[i]; 
            if(aAge>200) hue=(hue+30)%360; 
            if(aAge>800) hue=(hue+60)%360; 
            
            const e=energyMap[i]; 
            let satBase=55+e*3+(gravWaveActive?10:0); 
            let light=50+Math.min(25,e*2)+(solarFlareActive?10:0)+(nebulaActive?Math.sin(generation*0.1 + r*0.2 + c*0.2)*8:0); 
            
            // Modificación visual por alianzas (saturación y brillo)
            if(alliance > 0) {
              satBase = Math.min(95, satBase + 15); // Más saturado = más organizado
              light = Math.min(85, light + 10); // Más brillante = más cooperativo
            }
            
            if(aAge>400) light=Math.min(82, light+6); 
            if(aAge>1200) light=Math.min(88, light+8); 
            if(darkMatter){ const {cx,cy,radius}=darkMatter.meta; const dx=(c-cx+cols)%cols; const dy=(r-cy+rows)%rows; if(Math.sqrt(dx*dx+dy*dy)<radius) light*=0.7; } 
            
            ctx.fillStyle=`hsl(${Math.round(hue)}, ${Math.min(95,satBase)}%, ${Math.min(85,Math.max(15,light))}%)`; 
            ctx.fillRect(x,y,cellSize,cellSize); 
            
            // === OVERLAYS DE ARMAMENTO ===
            if(weapon > 0) {
              if(weapon === 1) { // Factory
                ctx.fillStyle = 'rgba(100,100,100,0.6)';
                ctx.fillRect(x+cellSize*0.2, y+cellSize*0.2, cellSize*0.6, cellSize*0.6);
              } else if(weapon === 2) { // Weapon
                ctx.fillStyle = 'rgba(200,0,0,0.7)';
                ctx.fillRect(x+cellSize*0.3, y+cellSize*0.3, cellSize*0.4, cellSize*0.4);
              } else if(weapon === 3) { // Nuke
                ctx.fillStyle = 'rgba(255,255,0,0.8)';
                ctx.beginPath();
                ctx.arc(x+cellSize*0.5, y+cellSize*0.5, cellSize*0.4, 0, Math.PI*2);
                ctx.fill();
                // Pulso nuclear
                if(generation % 10 < 3) {
                  ctx.fillStyle = 'rgba(255,100,0,0.4)';
                  ctx.beginPath();
                  ctx.arc(x+cellSize*0.5, y+cellSize*0.5, cellSize*0.6, 0, Math.PI*2);
                  ctx.fill();
                }
              }
            }
          }
          // Draw invader overlay (small core) if present
          if (warMode && invaderGrid[r][c]===1){
            const x=c*cellSize+driftX*0.2; const y=r*cellSize+driftY*0.2;
            ctx.fillStyle = invasion ? 'hsla(0,85%,60%,0.7)' : 'hsla(0,70%,50%,0.55)';
            ctx.fillRect(x+1,y+1,cellSize-2,cellSize-2);
          }
        }
      }
      if(solarFlareActive){ ctx.fillStyle='rgba(255,200,80,0.04)'; ctx.fillRect(0,0,width/2,height/2); }
      if(nebulaActive){ ctx.fillStyle='rgba(120,160,255,0.03)'; ctx.fillRect(0,0,width/2,height/2); }
      if(pulsar){ const event=pulsar; const phase=((generation-event.startGen)%event.meta.period)/event.meta.period; const flash=phase<0.25?(0.25-phase)/0.25:0; if(flash>0){ ctx.fillStyle=`rgba(200,230,255,${flash*0.08})`; ctx.fillRect(0,0,width/2,height/2);} }
      if(darkMatter){ const {cx,cy,radius}=darkMatter.meta; const grad=ctx.createRadialGradient(cx*cellSize,cy*cellSize,radius*cellSize*0.2,cx*cellSize,cy*cellSize,radius*cellSize*1.1); grad.addColorStop(0,'rgba(40,0,60,0.18)'); grad.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=grad; ctx.fillRect(0,0,width/2,height/2); }
      if(blackHole){ const {cx,cy,baseRadius}=blackHole.meta; const age=generation-blackHole.startGen; const rad=baseRadius+Math.min(40,age*0.05); const grad=ctx.createRadialGradient(cx*cellSize,cy*cellSize,0,cx*cellSize,cy*cellSize,rad*cellSize*1.8); grad.addColorStop(0,'rgba(0,0,0,0.9)'); grad.addColorStop(0.4,'rgba(0,0,0,0.6)'); grad.addColorStop(0.7,'rgba(60,30,80,0.25)'); grad.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalCompositeOperation='multiply'; ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(cx*cellSize,cy*cellSize,rad*cellSize*1.8,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
      if(quasar){ const {cx,cy,angle}=quasar.meta; ctx.save(); ctx.translate(cx*cellSize,cy*cellSize); ctx.rotate(angle); ctx.fillStyle='rgba(255,255,200,0.08)'; ctx.fillRect(0,-cellSize*6,width,cellSize*12); ctx.restore(); }
      if(cosmicStrings){ const {lines}=cosmicStrings.meta; ctx.strokeStyle='rgba(180,180,255,0.2)'; ctx.lineWidth=1; ctx.beginPath(); for(const line of lines){ if(line.vertical){ ctx.moveTo(line.a*cellSize+cellSize/2,0); ctx.lineTo(line.a*cellSize+cellSize/2,height/2);} else { ctx.moveTo(0,line.b*cellSize+cellSize/2); ctx.lineTo(width/2,line.b*cellSize+cellSize/2);} } ctx.stroke(); }
      if(wormhole){ ctx.fillStyle='rgba(180,120,255,0.04)'; ctx.fillRect(0,0,width/2,height/2); }
      if(gliderStorm){ ctx.save(); ctx.globalCompositeOperation='lighter'; const intensity=0.04+Math.sin((generation-gliderStorm.startGen)*0.3)*0.02; ctx.strokeStyle=`rgba(200,220,255,${intensity})`; ctx.lineWidth=1; for(let s=0;s<14;s++){ const off=((generation*3)+s*40)%(width/2+height/2); ctx.beginPath(); ctx.moveTo(-height/2+off,0); ctx.lineTo(off,height/2); ctx.stroke(); } ctx.restore(); }
      if(aurora){ const {bandCount,speed}=aurora.meta; ctx.fillStyle='rgba(255,255,255,0.05)'; for(let b=0;b<bandCount;b++){ const y=(generation*speed + b*100)%(height/2); ctx.fillRect(0,y,width/2,height/20); } }
      if(photon){ ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(0,0,width/2,height/2); }
      if(meteor){ const {trails}=meteor.meta; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,200,150,0.35)'; ctx.lineWidth=1.2; trails.forEach((t:any)=>{ const px=t.x*cellSize; const py=t.y*cellSize; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px - t.vx*8, py - t.vy*8); ctx.stroke(); t.x=(t.x+t.vx+cols)%cols; t.y=(t.y+t.vy+rows)%rows; if(!extralifeOnlyInvasion && Math.random()<0.2) currentGeneration[Math.floor(t.y)][Math.floor(t.x)]=1; }); ctx.restore(); }
      if(singularity){ const {cx,cy}=singularity.meta; const phase=(generation-singularity.startGen)/(singularity.endGen - singularity.startGen); const rad=10+phase*25; const grad=ctx.createRadialGradient(cx*cellSize,cy*cellSize,0,cx*cellSize,cy*cellSize,rad*cellSize); grad.addColorStop(0,'rgba(255,255,255,0.15)'); grad.addColorStop(0.6,'rgba(180,120,255,0.05)'); grad.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=grad; ctx.fillRect(0,0,width/2,height/2); }
      
      // Guerra galáctica: líneas de frente rojas épicas
      if(galacticWar){ 
        const {fronts,clusters} = galacticWar.meta;
        // Dibujar frentes de batalla
        ctx.save(); ctx.strokeStyle='rgba(255,40,40,0.85)'; ctx.lineWidth=3; ctx.beginPath(); 
        fronts.forEach((p:any,i:number)=>{ const x=p.x*cellSize; const y=p.y*cellSize; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); 
        ctx.stroke(); 
        // Efectos de explosión en frentes
        ctx.fillStyle='rgba(255,100,0,0.08)'; 
        fronts.forEach((p:any)=>{ const x=p.x*cellSize; const y=p.y*cellSize; ctx.beginPath(); ctx.arc(x,y,cellSize*6,0,Math.PI*2); ctx.fill(); });
        ctx.restore(); 
      }
      // Ancestral echo (multilayer fading history)
      if (ancestralEcho && history.length>8){ ctx.globalCompositeOperation='lighter'; const step=Math.floor(history.length/6); for(let layer=1;layer<=5;layer++){ const frame=history[history.length-1-layer*step]; if(!frame) continue; const alpha=0.015*(6-layer); ctx.fillStyle=`rgba(180,240,255,${alpha})`; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ if(frame[idx(r,c)]) ctx.fillRect(c*cellSize+driftX*0.2,r*cellSize+driftY*0.2,cellSize,cellSize); } } } ctx.globalCompositeOperation='source-over'; }
      if (ancestralEcho && history.length>8){ ctx.globalCompositeOperation='lighter'; const step=Math.floor(history.length/6); for(let layer=1;layer<=5;layer++){ const frame=history[history.length-1-layer*step]; if(!frame) continue; const alpha=0.015*(6-layer); ctx.fillStyle=`rgba(180,240,255,${alpha})`; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ if(frame[idx(r,c)]) ctx.fillRect(c*cellSize+driftX*0.2,r*cellSize+driftY*0.2,cellSize,cellSize); } } } ctx.globalCompositeOperation='source-over'; }

      // === EFECTOS VISUALES DE ESPECIES Y ARMAMENTO ===
      // Evolución de especies: aura multicolor
      if(isEventActive('SPECIES_EVOLUTION')){ 
        ctx.save();
        ctx.globalCompositeOperation='overlay';
        ctx.fillStyle='rgba(255,255,255,0.03)'; 
        ctx.fillRect(0,0,width/2,height/2);
        // Ondas de evolución
        const evolutionPhase = (generation * 0.02) % (Math.PI * 2);
        for(let wave=0; wave<3; wave++) {
          const waveRadius = 50 + wave * 80 + Math.sin(evolutionPhase + wave) * 30;
          const grad = ctx.createRadialGradient(width/4, height/4, 0, width/4, height/4, waveRadius);
          grad.addColorStop(0,'rgba(255,200,255,0.06)');
          grad.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=grad;
          ctx.fillRect(0,0,width/2,height/2);
        }
        ctx.restore(); 
      }
      
      // Guerra nuclear: destellos radiactivos
      if(isEventActive('NUCLEAR_WARFARE')){ 
        const nuclearPhase = (generation * 0.05) % 1;
        if(nuclearPhase < 0.3) { // Pulsos periódicos
          ctx.fillStyle=`rgba(255,255,0,${(0.3-nuclearPhase)*0.08})`; 
          ctx.fillRect(0,0,width/2,height/2);
        }
        // Ondas de radiación
        ctx.save();
        ctx.strokeStyle='rgba(255,200,0,0.12)';
        ctx.lineWidth=2;
        const waves = 5;
        for(let w=0; w<waves; w++) {
          const radius = (generation*2 + w*40) % 300;
          ctx.beginPath();
          ctx.arc(width/4, height/4, radius, 0, Math.PI*2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Debug: detectar clústeres cada cierto tiempo
      if(debug && generation % 20 === 0){
        const visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));
        const clusters: {x:number;y:number;w:number;h:number;size:number}[] = [];
        for(let r=0;r<rows;r++){
          for(let c=0;c<cols;c++){
            if(!currentGeneration[r][c] || visited[r][c]) continue;
            let minR=r,maxR=r,minC=c,maxC=c,size=0;
            const q:[[number,number]]=[] as any; q.push([r,c]); visited[r][c]=true;
            while(q.length && size<5000){ const [rr,cc]=q.pop()!; size++; for(let dr=-1;dr<=1;dr++){ for(let dc=-1;dc<=1;dc++){ if(dr===0&&dc===0) continue; const nr=(rr+dr+rows)%rows; const nc=(cc+dc+cols)%cols; if(!visited[nr][nc] && currentGeneration[nr][nc]){ visited[nr][nc]=true; q.push([nr,nc]); if(nr<minR)minR=nr; if(nr>maxR)maxR=nr; if(nc<minC)minC=nc; if(nc>maxC)maxC=nc; } } } }
            clusters.push({x:minC,y:minR,w:maxC-minC+1,h:maxR-minR+1,size});
            if(clusters.length>40) break; // límite
          }
          if(clusters.length>40) break;
        }
        // Guardar sólo los mayores
        clusters.sort((a,b)=>b.size-a.size); clustersRef.current=clusters.slice(0,8);
      }

      if(debug){
        // Dibujar bounding boxes de clústeres
        ctx.save();
        ctx.strokeStyle='rgba(0,255,180,0.6)';
        ctx.lineWidth=1;
        for(const cl of clustersRef.current){
          const x=cl.x*cellSize+driftX*0.2; const y=cl.y*cellSize+driftY*0.2; ctx.strokeRect(x,y,cl.w*cellSize,cl.h*cellSize);
        }
        ctx.restore();
        // Lista de eventos
        ctx.fillStyle='rgba(0,0,0,0.45)';
        ctx.fillRect(4,4,200, (activeEvents.length+6)*14);
        ctx.fillStyle='#fff';
        ctx.font='10px monospace';
        ctx.fillText(`Gen: ${generation}`,10,16);
        ctx.fillText(`Entropía: ${entropy.toFixed(2)}`,10,28);
        let oy=42; for(const ev of activeEvents.slice(-10)){ ctx.fillText(`${ev.type}`,10,oy); oy+=12; }
      }
      // Removed gliderTracks/globalOscillation diagnostic overlays to finalize minimal war universe.
      const now=performance.now(); const inactivity=now-lastPointerMove; const ghostAlpha=Math.max(0,1-(inactivity - inactivityFadeAfter)/2000); if(ghostAlpha>0){ const radius=90+Math.sin(timestamp*0.001)*10; const grad=ctx.createRadialGradient(ghostX,ghostY,0,ghostX,ghostY,radius); grad.addColorStop(0,`rgba(180,200,255,${0.12*ghostAlpha})`); grad.addColorStop(0.4,`rgba(120,150,255,${0.05*ghostAlpha})`); grad.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(ghostX,ghostY,radius,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
      for(let i=ripples.length-1;i>=0;i--){ const r=ripples[i]; const age=now-r.start; if(age>rippleDuration){ ripples.splice(i,1); continue; } const t=age/rippleDuration; const rad=20+t*180; const alpha=0.18*(1-t); ctx.strokeStyle=`rgba(180,220,255,${alpha})`; ctx.lineWidth=1+t*2; ctx.beginPath(); ctx.arc(r.x,r.y,rad,0,Math.PI*2); ctx.stroke(); }
      animationRef.current = requestAnimationFrame(animate);
    };

    // Helper note: stagnation detection = liveCount idéntico muchas generaciones (stagnationCounter++). Baja densidad = liveCount muy pequeño frente a cellCount o averageEnergy bajo. No se fuerza resurrección; solo eventos INVASION crean nueva dinámica.

    // Init
    initializeGrid(); // se llama una sola vez; no hay más reinicios automáticos
    setTimeout(()=>spawnEvent('NEBULA'),1500);
    setTimeout(()=>spawnEvent('SOLAR_FLARE'),4000);
    animationRef.current = requestAnimationFrame(animate);

    // Reinicio manual mediante tecla 'R'
    const keyHandler = (e:KeyboardEvent) => {
      if (e.key==='r' || e.key==='R') {
        if (extinct) manualRestart();
      }
      if (e.key==='d' || e.key==='D') setDebug(d=>!d);
    };
    window.addEventListener('keydown', keyHandler);

    // Exponer controles a la UI
    controlsRef.current = { 
      spawnInvasion: () => { 
        if(!extinct) {
          spawnEvent('INVASION'); 
          // Al invocar invasión, temporalmente permitir nacimientos
          setTimeout(() => {
            // Inyectar vida extraterrestre en químicas ricas tras breve delay
            for(let k=0; k<15; k++) {
              const r = Math.floor(Math.random()*rows);
              const c = Math.floor(Math.random()*cols);
              if(chemoB[idx(r,c)] > 0.4) {
                currentGeneration[r][c] = 1;
                invaderGrid[r][c] = 1;
              }
            }
          }, 200);
        } 
      } 
    };

    // Exponer controles de test
    testControlsRef.current = {
      spawnSpeciesEvolution: () => {
        if(!extinct) {
          spawnEvent('SPECIES_EVOLUTION');
          console.log('🧬 Test: Forced SPECIES_EVOLUTION event');
        }
      },
      spawnNuclearWarfare: () => {
        if(!extinct) {
          spawnEvent('NUCLEAR_WARFARE');
          console.log('☢️ Test: Forced NUCLEAR_WARFARE event');
        }
      },
      spawnGalacticWar: () => {
        if(!extinct) {
          spawnEvent('GALACTIC_WAR');
          console.log('⚔️ Test: Forced GALACTIC_WAR event');
        }
      }
    };

    return () => { if(animationRef.current) cancelAnimationFrame(animationRef.current); canvas.removeEventListener('mousemove', handleMove); canvas.removeEventListener('click', handleClick); window.removeEventListener('keydown', keyHandler); };
  }, []);

  // Reinicio manual: usuario decide comenzar nuevo ciclo
  const manualRestart = () => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); if(!ctx) return;
    setExtinct(false);
    // Re-declarar dimensiones y re-inicializar estructuras dentro de un nuevo efecto menor
    // Como toda la lógica vive en el useEffect original, la forma más simple es forzar recarga de la página
    // pero preferimos reconstruir manualmente llamando nuevamente a location.reload para simplicidad estable.
    // (Alternativa: mover la lógica a función reutilizable; aquí optamos por recarga directa para no duplicar código.)
    window.location.reload();
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-quantum-blue/10 to-transparent pointer-events-none" />
      <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
        <button onClick={()=>setDebug(d=>!d)} className="px-3 py-1.5 rounded bg-slate-700/70 hover:bg-slate-600 text-xs text-white">Debug {debug?'ON':'OFF'}</button>
        {!extinct && <button onClick={()=>controlsRef.current?.spawnInvasion()} className="px-3 py-1.5 rounded bg-rose-600/80 hover:bg-rose-500 text-xs text-white">Invasión</button>}
        {!extinct && <button onClick={()=>testControlsRef.current?.spawnSpeciesEvolution()} className="px-3 py-1.5 rounded bg-purple-600/80 hover:bg-purple-500 text-xs text-white">🧬 Evolución</button>}
        {!extinct && <button onClick={()=>testControlsRef.current?.spawnNuclearWarfare()} className="px-3 py-1.5 rounded bg-yellow-600/80 hover:bg-yellow-500 text-xs text-white">☢️ Nuclear</button>}
        {!extinct && <button onClick={()=>testControlsRef.current?.spawnGalacticWar()} className="px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-500 text-xs text-white">⚔️ Guerra</button>}
      </div>
      {extinct && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 text-center">
          <div className="text-white text-xl font-semibold">El universo ha muerto</div>
            <button onClick={manualRestart} className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition">
              Reiniciar Universo (Nuevo ciclo)
            </button>
            <div className="text-xs text-white/70">Pulsa R para reiniciar</div>
        </div>
      )}
    </div>
  );
};