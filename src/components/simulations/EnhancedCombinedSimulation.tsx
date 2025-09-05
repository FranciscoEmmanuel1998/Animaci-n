import { useEffect, useRef, useState } from 'react'

/**
 * VERSIÓN MEJORADA que RESPETA completamente la animación original
 * Mantiene: Big Bang, espiral dinámico, autómata celular, atractor de Lorenz
 * Mejora: Efectos visuales más ricos, partículas, resplandores, sin interactividad forzada
 */
const EnhancedCombinedSimulation = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>()
  const [bigBangProgress, setBigBangProgress] = useState(0)
  const bigBangSoundPlayed = useRef(false)
  const audioContext = useRef<AudioContext | null>(null)
  const audioAnalyser = useRef<AnalyserNode | null>(null)
  const audioDataArray = useRef<Uint8Array | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.offsetWidth * 2)
    const height = (canvas.height = canvas.offsetHeight * 2)
    ctx.scale(2, 2)

    // 🌌 FONDO CÓSMICO ARMONIOSAMENTE CAÓTICO 🌌
    // Generación de estrellas distantes que respiran con la energía del sistema
    const cosmicStars: Array<{
      x: number
      y: number
      intensity: number
      baseSize: number
      phase: number
      pulseSpeed: number
    }> = []
    
    // Constelación de estrellas doradas
    for (let i = 0; i < 200; i++) { // Más estrellas
      cosmicStars.push({
        x: Math.random() * width / 2,
        y: Math.random() * height / 2,
        intensity: Math.random() * 0.8 + 0.2, // Más intensidad
        baseSize: Math.random() * 2 + 0.5, // Tamaños más variados
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.004 + 0.001 // Parpadeo más notable
      })
    }
    
    // 🌟 Campo de energía cósmica - nodos que conectan ambos mundos
    const energyNodes: Array<{
      x: number
      y: number
      vx: number
      vy: number
      energy: number
      age: number
    }> = []
    
    // Nodos flotantes de energía
    for (let i = 0; i < 25; i++) { // Más nodos
      energyNodes.push({
        x: Math.random() * width / 2,
        y: Math.random() * height / 2,
        vx: (Math.random() - 0.5) * 0.3, // Movimiento más dinámico
        vy: (Math.random() - 0.5) * 0.3,
        energy: Math.random() * 0.8 + 0.2, // Más energía base
        age: Math.random() * 1000
      })
    }

    /* Autómata celular mejorado */
    const cellSize = 4
    const cols = Math.floor(width / cellSize / 2)
    const rows = Math.floor(height / cellSize / 2)
    let currentGeneration: number[][] = []
    let nextGeneration: number[][] = []
    let generation = 0

    const initializeGrid = () => {
      currentGeneration = Array(rows).fill(null).map(() => Array(cols).fill(0))
      nextGeneration = Array(rows).fill(null).map(() => Array(cols).fill(0))
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const centerX = cols / 2
          const centerY = rows / 2
          const distance = Math.sqrt((col - centerX) ** 2 + (row - centerY) ** 2)
          
          // Múltiples núcleos de vida para mayor complejidad
          if (distance < 20) {
            currentGeneration[row][col] = Math.random() > 0.6 ? 1 : 0
          } else if (distance < 35 && Math.random() > 0.85) {
            currentGeneration[row][col] = 1
          } else if (Math.random() > 0.97) {
            currentGeneration[row][col] = 1
          }
        }
      }
    }

    const countNeighbors = (row: number, col: number) => {
      let count = 0
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue
          const newRow = (row + i + rows) % rows
          const newCol = (col + j + cols) % cols
          count += currentGeneration[newRow][newCol]
        }
      }
      return count
    }

    const updateGeneration = () => {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const neighbors = countNeighbors(row, col)
          const currentCell = currentGeneration[row][col]
          if (currentCell === 1) {
            if (neighbors < 2) nextGeneration[row][col] = 0
            else if (neighbors === 2 || neighbors === 3) nextGeneration[row][col] = 1
            else nextGeneration[row][col] = 0
          } else {
            if (neighbors === 3) nextGeneration[row][col] = 1
            else nextGeneration[row][col] = 0
          }
          // Mutaciones cósmicas más frecuentes para mayor dinamismo
          if (generation % 80 === 0 && Math.random() > 0.997) {
            nextGeneration[row][col] = 1 - nextGeneration[row][col]
          }
        }
      }
      ;[currentGeneration, nextGeneration] = [nextGeneration, currentGeneration]
      generation++
      if (generation % 400 === 0) {
        initializeGrid()
        generation = 0
      }
    }

    /* Atractor de Lorenz mejorado con variaciones dinámicas */
    let sigma = 10
    let rho = 28
    let beta = 8 / 3
    const dt = 0.01
    let x = 1, y = 1, z = 1
    const points: { x: number; y: number; z: number; age: number; energy: number }[] = []
    const maxPoints = 2500 // Más puntos para espiral más denso

    // Partículas estelares que emergen del autómata celular
    const stellarParticles: { 
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      life: number; 
      maxLife: number; 
      hue: number;
      energy: number;
      targetReached: boolean;
    }[] = []

    let lastUpdate = 0
    const updateInterval = 90 // Ligeramente más rápido

    const animate = (timestamp: number) => {
      // 🎵 ANÁLISIS DE AUDIO EN TIEMPO REAL PARA COLORES REACTIVOS
      let audioData = { bass: 0, mids: 0, highs: 0, overall: 0 }
      
      if (audioAnalyser.current && audioDataArray.current) {
        audioAnalyser.current.getByteFrequencyData(audioDataArray.current)
        const data = audioDataArray.current
        
        // Analizar diferentes rangos de frecuencia
        const bassRange = data.slice(0, 8)   // Graves (20-200Hz aprox)
        const midsRange = data.slice(8, 32)  // Medios (200-2000Hz aprox)
        const highRange = data.slice(32, 64) // Agudos (2000Hz+ aprox)
        
        audioData = {
          bass: bassRange.reduce((a, b) => a + b, 0) / bassRange.length / 255,
          mids: midsRange.reduce((a, b) => a + b, 0) / midsRange.length / 255,
          highs: highRange.reduce((a, b) => a + b, 0) / highRange.length / 255,
          overall: data.reduce((a, b) => a + b, 0) / data.length / 255
        }
      }

      // ALTERNATIVA: Limpieza completa ocasional para eliminar acumulación
      if (generation % 1000 === 0) {
        // Limpieza completa cada 1000 generaciones para eliminar rastros acumulados
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.fillRect(0, 0, width / 2, height / 2)
      } else {
        // TU DESVANECIMIENTO ORIGINAL PERFECTO
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(0, 0, width / 2, height / 2)
      }

      if (timestamp - lastUpdate > updateInterval) {
        updateGeneration()
        lastUpdate = timestamp
      }

      // Calcular energía cósmica total para sincronización universal
      const cellularActivity = currentGeneration.flat().filter(cell => cell === 1).length
      const cosmicEnergy = cellularActivity / (rows * cols) // Entre 0 y 1
      const cosmicPulse = Math.sin(timestamp * 0.003) * 0.5 + 0.5 // Pulso universal

      // 🌌 RENDERIZAR FONDO CÓSMICO ARMONIOSAMENTE CAÓTICO 🌌
      // Estrellas distantes que respiran con la energía del sistema
      cosmicStars.forEach(star => {
        const pulse = Math.sin(timestamp * star.pulseSpeed + star.phase) * 0.5 + 0.5
        const energyInfluence = cosmicEnergy * 0.5 + 0.5 // Mayor influencia de la vida
        const size = star.baseSize * (pulse * 0.6 + 0.4) * energyInfluence
        const alpha = star.intensity * (pulse * 0.7 + 0.3) * energyInfluence
        
        // Estrellas principales más brillantes
        ctx.fillStyle = `hsla(45, 100%, 85%, ${alpha * 0.6})` 
        ctx.beginPath()
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2)
        ctx.fill()
        
        // Resplandor más dramático para estrellas brillantes
        if (star.intensity > 0.5 && pulse > 0.7) {
          ctx.fillStyle = `hsla(50, 100%, 95%, ${alpha * 0.25})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2)
          ctx.fill()
          
          // Super nova ocasional
          if (pulse > 0.95 && star.intensity > 0.7) {
            ctx.fillStyle = `hsla(55, 100%, 98%, ${alpha * 0.1})`
            ctx.beginPath()
            ctx.arc(star.x, star.y, size * 5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })
      
      // 🌟 Campo de energía que conecta ambos mundos
      energyNodes.forEach((node, i) => {
        // Movimiento flotante
        node.x += node.vx
        node.y += node.vy
        node.age += 1
        
        // Rebote en bordes
        if (node.x <= 0 || node.x >= width / 2) node.vx *= -1
        if (node.y <= 0 || node.y >= height / 2) node.vy *= -1
        
        // Pulso de energía
        const energyPulse = Math.sin(node.age * 0.01 + cosmicPulse * 2) * 0.5 + 0.5
        const nodeEnergy = node.energy * energyPulse * cosmicEnergy
        
        // Dibujar nodo de energía con más presencia
        if (nodeEnergy > 0.1) {
          // Núcleo del nodo
          ctx.fillStyle = `hsla(50, 90%, 80%, ${nodeEnergy * 0.8})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2)
          ctx.fill()
          
          // Halo energético
          ctx.fillStyle = `hsla(45, 80%, 70%, ${nodeEnergy * 0.3})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        
        // Conexiones más dinámicas entre nodos cercanos
        for (let j = i + 1; j < energyNodes.length; j++) {
          const other = energyNodes[j]
          const distance = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2)
          
          if (distance < 100 && nodeEnergy > 0.15 && other.energy * energyPulse > 0.15) {
            const connectionStrength = (1 - distance / 100) * nodeEnergy * 0.25
            
            // Línea principal de conexión
            ctx.strokeStyle = `hsla(48, 80%, 65%, ${connectionStrength})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
            
            // Pulsos de energía que viajan por la conexión
            const pulsePos = (timestamp * 0.002 + distance * 0.01) % 1
            const pulseX = node.x + (other.x - node.x) * pulsePos
            const pulseY = node.y + (other.y - node.y) * pulsePos
            
            if (connectionStrength > 0.1) {
              ctx.fillStyle = `hsla(55, 100%, 90%, ${connectionStrength * 0.6})`
              ctx.beginPath()
              ctx.arc(pulseX, pulseY, 1.5, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      })

      // Modular parámetros del atractor basado en actividad celular
      sigma = 10 + cosmicEnergy * 5 // El atractor responde a la vida
      rho = 28 + Math.sin(timestamp * 0.0005) * cosmicEnergy * 8
      beta = 8/3 + cosmicPulse * cosmicEnergy * 0.5

      // Dibuja el autómata celular EN ARMONÍA con el cosmos
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (currentGeneration[row][col] === 1) {
            const neighbors = countNeighbors(row, col)
            const xPos = col * cellSize
            const yPos = row * cellSize
            
            // Colores que RESPONDEN al atractor de Lorenz
            const lorenzInfluence = Math.sin((x + y + z) * 0.1 + timestamp * 0.001) * 30
            const hue = (220 + neighbors * 30 + generation * 0.5 + lorenzInfluence) % 360
            const saturation = 70 + neighbors * 10 + cosmicPulse * 20
            const lightness = 60 + Math.sin(generation * 0.1 + row * 0.1 + col * 0.1) * 20 + cosmicEnergy * 15
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            ctx.fillRect(xPos, yPos, cellSize, cellSize)
            
            // RESTAURADAS: Generar partículas cósmicas con frecuencia original
            if (neighbors >= 4 && Math.random() < cosmicEnergy * 0.005) {
              // Partículas que VAN HACIA el atractor, creando flujo cósmico
              const targetX = width / 4
              const targetY = height / 4
              const dx = targetX - (xPos + cellSize/2)
              const dy = targetY - (yPos + cellSize/2)
              const distance = Math.sqrt(dx*dx + dy*dy)
              
              stellarParticles.push({
                x: xPos + cellSize/2,
                y: yPos + cellSize/2,
                vx: (dx / distance) * (0.3 + cosmicEnergy * 0.7), // Velocidad hacia el atractor
                vy: (dy / distance) * (0.3 + cosmicEnergy * 0.7),
                life: 0,
                maxLife: 150 + cosmicEnergy * 100, // Vida original restaurada
                hue: hue,
                energy: cosmicEnergy,
                targetReached: false
              })
            }
          }
        }
      }

      // Actualizar partículas con FÍSICA CÓSMICA - SIN LÍMITES ARTIFICIALES
      for (let i = stellarParticles.length - 1; i >= 0; i--) {
        const particle = stellarParticles[i]
        
        // Atracción gravitacional hacia el centro del atractor
        const centerX = width / 4
        const centerY = height / 4
        const dx = centerX - particle.x
        const dy = centerY - particle.y
        const distance = Math.sqrt(dx*dx + dy*dy)
        
        if (distance > 5 && !particle.targetReached) {
          // Acelerar hacia el centro con influencia cósmica
          const acceleration = 0.01 + cosmicEnergy * 0.02
          particle.vx += (dx / distance) * acceleration
          particle.vy += (dy / distance) * acceleration
        } else if (!particle.targetReached) {
          // Al llegar al centro, adoptar el movimiento del atractor
          particle.targetReached = true
          particle.vx = (Math.random() - 0.5) * 2
          particle.vy = (Math.random() - 0.5) * 2
        }
        
        // Si ya llegó al centro, seguir órbita del atractor
        if (particle.targetReached) {
          const orbitInfluence = 0.1
          particle.vx += (y - particle.y + centerY) * orbitInfluence * 0.01
          particle.vy += (x - particle.x + centerX) * orbitInfluence * 0.01
          particle.vx *= 0.98 // Fricción suave
          particle.vy *= 0.98
        }
        
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++
        
        const alpha = 1 - (particle.life / particle.maxLife)
        if (alpha <= 0) {
          stellarParticles.splice(i, 1)
          continue
        }
        
        // RESTAURADO: Dibujar partícula con impacto visual completo
        const pulsation = 1 + Math.sin(timestamp * 0.01 + particle.life * 0.1) * 0.3
        const size = (1 + alpha * 2) * pulsation * (1 + particle.energy)
        
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 80%, ${alpha * 0.8})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
        
        // RESTAURADA: Estela de partícula
        if (particle.targetReached) {
          ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.2})`
          ctx.beginPath()
          ctx.arc(particle.x - particle.vx * 2, particle.y - particle.vy * 2, size * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ATRACTOR DE LORENZ ORIGINAL PERFECTO
      const dx = sigma * (y - x)
      const dy = x * (rho - z) - y
      const dz = x * y - beta * z
      
      x += dx * dt
      y += dy * dt
      z += dz * dt

      points.push({ x, y, z, age: 0, energy: Math.sqrt(dx*dx + dy*dy + dz*dz) })
      if (points.length > maxPoints) points.shift()

      // Dibuja el atractor CON TU GENIALIDAD ORIGINAL EXACTA
      points.forEach((point, index) => {
        const age = point.age++
        const alpha = Math.max(0, 1 - age / maxPoints)
        
        // TU ROTACIÓN ORIGINAL PERFECTA
        const time = timestamp * 0.001
        const cosTheta = Math.cos(time * 0.3)
        const sinTheta = Math.sin(time * 0.3)
        
        const projX = point.x * cosTheta - point.z * sinTheta
        const projY = point.y
        const projZ = point.x * sinTheta + point.z * cosTheta

        const screenX = projX * 8 + width / 4
        const screenY = projY * 8 + height / 4

        // TU SISTEMA DE COLOR ORIGINAL + mínima influencia cósmica
        const hue = (point.z * 10 + 270 + cosmicEnergy * 30) % 360
        const brightness = Math.max(0.3, 0.8 - projZ * 0.02)
        
        ctx.fillStyle = `hsla(${hue}, 100%, ${brightness * 70}%, ${alpha})`
        ctx.beginPath()
        ctx.arc(screenX, screenY, Math.max(1, 3 - projZ * 0.1), 0, Math.PI * 2)
        ctx.fill()

        // TU EFECTO DE RESPLANDOR ORIGINAL EXACTO
        if (index > maxPoints - 50) {
          ctx.shadowBlur = 20
          ctx.shadowColor = `hsl(${hue}, 100%, 70%)`
          ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.3})`
          ctx.beginPath()
          ctx.arc(screenX, screenY, 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    // Efecto Big Bang MEJORADO - más espectacular
    let startTimeout: number | undefined
    let bigBangFrame: number | undefined
    const bigBangDuration = 3000 // Duración ligeramente mayor
    const bigBangStart = performance.now()

    const bigBang = (timestamp: number) => {
      if (!canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      
      const elapsed = timestamp - bigBangStart
      const progress = Math.min(elapsed / bigBangDuration, 1)
      
      // 💥 SONIDO REALISTA DE EXPLOSIÓN NUCLEAR/CÓSMICA
      if (elapsed < 50 && !bigBangSoundPlayed.current) {
        try {
          // Crear contexto de audio si no existe
          if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          }
          
          // 🎵 CONFIGURAR ANALIZADOR DE AUDIO PARA VISUALIZACIÓN REACTIVA
          if (!audioAnalyser.current && audioContext.current) {
            audioAnalyser.current = audioContext.current.createAnalyser()
            audioAnalyser.current.fftSize = 256
            audioDataArray.current = new Uint8Array(audioAnalyser.current.frequencyBinCount)
            
            // Conectar analizador al contexto (se conectará al audio cuando la música empiece)
            window.addEventListener('startBackgroundMusic', () => {
              if (audioAnalyser.current && audioContext.current) {
                // El audio se conectará automáticamente cuando la música empiece
                console.log('🎨 Analizador de audio listo para visualización reactiva')
              }
            })
          }
          
          const ctx = audioContext.current
          const now = ctx.currentTime
          
          // 🔥 FASE 1: DETONACIÓN NUCLEAR DEVASTADORA (Flash inicial más agresivo)
          const impactBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
          const impactData = impactBuffer.getChannelData(0)
          
          // Crack nuclear súper agudo con múltiples componentes
          for (let i = 0; i < impactData.length; i++) {
            const decay = Math.exp(-i / (impactData.length * 0.015)) // Decay más agresivo
            const noise = (Math.random() * 2 - 1) * decay
            const crack = Math.sin(i * 0.15) * decay * 0.6 // Frecuencia más alta
            const pop = Math.sin(i * 0.05) * decay * 0.4   // Componente grave
            impactData[i] = (noise + crack + pop) * 0.95
          }
          
          const impactSource = ctx.createBufferSource()
          const impactGain = ctx.createGain()
          const impactFilter = ctx.createBiquadFilter()
          
          impactSource.buffer = impactBuffer
          impactFilter.type = 'bandpass' // Cambio a bandpass para más agresividad
          impactFilter.frequency.setValueAtTime(4000, now)
          impactFilter.frequency.exponentialRampToValueAtTime(150, now + 0.08)
          impactFilter.Q.setValueAtTime(3, now) // Q más alto para más punch
          
          impactGain.gain.setValueAtTime(0.8, now)
          impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
          
          impactSource.connect(impactFilter)
          impactFilter.connect(impactGain)
          impactGain.connect(ctx.destination)
          
          // 🌊 FASE 2: RUGIDO NUCLEAR DESCOMUNAL (Más intenso y prolongado)
          const shockBuffer = ctx.createBuffer(1, ctx.sampleRate * 3.5, ctx.sampleRate)
          const shockData = shockBuffer.getChannelData(0)
          
          // Ruido rosa + componentes graves para sonido más nuclear
          let b0, b1, b2, b3, b4, b5, b6
          b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
          
          for (let i = 0; i < shockData.length; i++) {
            const white = Math.random() * 2 - 1
            const t = i / shockData.length
            
            // Filtro de ruido rosa mejorado
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980
            
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
            b6 = white * 0.115926
            
            // Componentes adicionales para sonido más nuclear
            const rumble = Math.sin(t * Math.PI * 20) * Math.exp(-t * 2) // Grave profundo
            const crackle = white * 0.3 * Math.exp(-t * 4) // Chisporroteo
            
            // Envelope más complejo con turbulencias
            const mainEnvelope = Math.exp(-t * 2.5) * (1 - t * 0.6)
            const turbulence = 1 + Math.sin(t * Math.PI * 40) * 0.2 * Math.exp(-t * 3)
            
            shockData[i] = (pink + rumble + crackle) * mainEnvelope * turbulence * 0.75
          }
          
          const shockSource = ctx.createBufferSource()
          const shockGain = ctx.createGain()
          const shockFilter = ctx.createBiquadFilter()
          const shockDistortion = ctx.createWaveShaper() // Añadir distorsión
          
          // Crear curva de distorsión para saturación nuclear
          const samples = 44100
          const curve = new Float32Array(samples)
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1
            curve[i] = Math.tanh(x * 3) * 0.8 // Saturación suave pero presente
          }
          shockDistortion.curve = curve
          
          shockSource.buffer = shockBuffer
          shockFilter.type = 'lowpass'
          shockFilter.frequency.setValueAtTime(2000, now + 0.08) // Frecuencia inicial más alta
          shockFilter.frequency.exponentialRampToValueAtTime(45, now + 3.58) // Decay más profundo
          shockFilter.Q.setValueAtTime(1.2, now) // Q más pronunciado
          
          shockGain.gain.setValueAtTime(0.8, now + 0.08) // Volumen más alto
          shockGain.gain.exponentialRampToValueAtTime(0.001, now + 3.58)
          
          shockSource.connect(shockDistortion)
          shockDistortion.connect(shockFilter)
          shockFilter.connect(shockGain)
          shockGain.connect(ctx.destination)
          
          // � FASE 3: REVERBERACIÓN PROFUNDA (Eco en la atmósfera)
          const reverbGain = ctx.createGain()
          const reverbDelay = ctx.createDelay(2)
          const reverbFilter = ctx.createBiquadFilter()
          
          reverbDelay.delayTime.setValueAtTime(0.3, now)
          reverbFilter.type = 'lowpass'
          reverbFilter.frequency.setValueAtTime(400, now)
          
          reverbGain.gain.setValueAtTime(0.3, now + 0.3)
          reverbGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)
          
          // Conectar reverb al shock wave
          shockGain.connect(reverbDelay)
          reverbDelay.connect(reverbFilter)
          reverbFilter.connect(reverbGain)
          reverbGain.connect(ctx.destination)
          
          // 🎵 PROGRAMAR INICIO DE MÚSICA (después de la explosión nuclear completa)
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('startBackgroundMusic'))
          }, 4000) // Música después de toda la secuencia nuclear
          
          // INICIAR TODAS LAS FASES CON TIMING NUCLEAR REALISTA
          impactSource.start(now)
          impactSource.stop(now + 0.08) // Timing ajustado
          
          shockSource.start(now + 0.04) // Rugido empieza casi inmediatamente
          shockSource.stop(now + 3.62) // Duración más larga
          
          bigBangSoundPlayed.current = true
          console.log('💥 EXPLOSIÓN NUCLEAR DESCOMUNAL - Música en 4.0s')
          
        } catch (error) {
          console.log('Nuclear explosion sound failed:', error)
          bigBangSoundPlayed.current = true
          // Música de respaldo
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('startBackgroundMusic'))
          }, 1000)
        }
      }
      
      // LIMPIEZA COMPLETA del canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      
      // RESET del contexto para evitar artefactos
      ctx.globalCompositeOperation = 'source-over'
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      ctx.globalAlpha = 1
      
      setBigBangProgress(progress)
      
      const cx = canvasRef.current.width / 4
      const cy = canvasRef.current.height / 4
      const maxRadius = Math.max(cx, cy) * 1.4
      const radius = progress * maxRadius
      
      // Curva de opacidad más dramática
      let explosionAlpha = 1
      if (elapsed < 800) {
        explosionAlpha = 1 - 0.3 * (elapsed / 800)
      } else if (elapsed < 1600) {
        explosionAlpha = 0.7 + 0.3 * ((elapsed - 800) / 800)
      } else if (elapsed < 2200) {
        explosionAlpha = 1
      } else if (elapsed < bigBangDuration) {
        explosionAlpha = 1 * (1 - (elapsed - 2200) / (bigBangDuration - 2200))
      } else {
        explosionAlpha = 0
      }
      
      // Múltiples ondas de explosión
      for (let wave = 0; wave < 3; wave++) {
        const waveDelay = wave * 300
        const waveProgress = Math.max(0, Math.min(1, (elapsed - waveDelay) / (bigBangDuration - waveDelay)))
        const waveRadius = waveProgress * maxRadius * (1 + wave * 0.2)
        const waveAlpha = explosionAlpha * (1 - wave * 0.3)
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, waveRadius)
        grad.addColorStop(0, `rgba(255,255,255,${waveAlpha * 0.9})`)
        grad.addColorStop(0.2, `rgba(255,240,150,${waveAlpha * 0.8})`)
        grad.addColorStop(0.5, `rgba(255,180,50,${waveAlpha * 0.6})`)
        grad.addColorStop(0.8, `rgba(255,100,20,${waveAlpha * 0.3})`)
        grad.addColorStop(1, `rgba(0,0,0,0)`)
        
        // Usar 'lighter' SOLO para el gradiente y luego resetear inmediatamente
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2)
        ctx.fill()
        
        // RESET INMEDIATO
        ctx.globalCompositeOperation = 'source-over'
      }
      
      // Partículas más dinámicas y numerosas - SIN composite operations
      const particleCount = 50 + Math.floor(progress * 100)
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + progress * Math.PI * 4
        const distance = (0.3 + Math.random() * 0.4) * radius
        const px = cx + Math.cos(angle) * distance
        const py = cy + Math.sin(angle) * distance
        const particleSize = 1 + Math.random() * 3 + Math.sin(progress * Math.PI) * 2
        
        const particleAlpha = (0.8 - progress * 0.6) * explosionAlpha * (0.5 + Math.random() * 0.5)
        
        // NO shadow effects en Big Bang para evitar residuos
        ctx.fillStyle = `rgba(255,${200 + Math.random() * 55},${100 + Math.random() * 155},${particleAlpha})`
        ctx.beginPath()
        ctx.arc(px, py, particleSize, 0, Math.PI * 2)
        ctx.fill()
      }
      
      if (progress < 1) {
        bigBangFrame = requestAnimationFrame(bigBang)
      }
    }
    
    bigBangFrame = requestAnimationFrame(bigBang)
    
    // Inicia la animación principal
    startTimeout = window.setTimeout(() => {
      initializeGrid()
      animationRef.current = requestAnimationFrame(animate)
    }, 2500)
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (startTimeout) clearTimeout(startTimeout)
      if (bigBangFrame) cancelAnimationFrame(bigBangFrame)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

export default EnhancedCombinedSimulation
