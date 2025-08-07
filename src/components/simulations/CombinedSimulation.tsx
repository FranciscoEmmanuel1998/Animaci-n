import { useEffect, useRef, useState } from 'react'

/**
 * Combina el autómata celular y el atractor de Lorenz en un solo
 * bucle de animación. Además, se superpone un texto con resplandor
 * dorado que cambia de color y emite partículas desde el fondo.
 */
const CombinedSimulation = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>()
  const [bigBangProgress, setBigBangProgress] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.offsetWidth * 2)
    const height = (canvas.height = canvas.offsetHeight * 2)
    ctx.scale(2, 2)

    /* Autómata celular */
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
          if (distance < 20) {
            currentGeneration[row][col] = Math.random() > 0.6 ? 1 : 0
          } else if (Math.random() > 0.95) {
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
          if (generation % 100 === 0 && Math.random() > 0.998) {
            nextGeneration[row][col] = 1 - nextGeneration[row][col]
          }
        }
      }
      ;[currentGeneration, nextGeneration] = [nextGeneration, currentGeneration]
      generation++
      if (generation % 500 === 0) {
        initializeGrid()
        generation = 0
      }
    }

    /* Atractor de Lorenz */
    const sigma = 10
    const rho = 28
    const beta = 8 / 3
    const dt = 0.01
    let x = 1, y = 1, z = 1
    const points: { x: number; y: number; z: number; age: number }[] = []
    const maxPoints = 2000

   

    let lastUpdate = 0
    const updateInterval = 100

    const animate = (timestamp: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(0, 0, width / 2, height / 2)

      if (timestamp - lastUpdate > updateInterval) {
        updateGeneration()
        lastUpdate = timestamp
      }

      // Dibuja el autómata celular
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (currentGeneration[row][col] === 1) {
            const neighbors = countNeighbors(row, col)
            const xPos = col * cellSize
            const yPos = row * cellSize
            const hue = (220 + neighbors * 30 + generation * 0.5) % 360
            const saturation = 70 + neighbors * 10
            const lightness = 60 + Math.sin(generation * 0.1 + row * 0.1 + col * 0.1) * 20
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            ctx.fillRect(xPos, yPos, cellSize, cellSize)
          }
        }
      }

      // Paso del atractor de Lorenz
      const dx = sigma * (y - x)
      const dy = x * (rho - z) - y
      const dz = x * y - beta * z
      x += dx * dt
      y += dy * dt
      z += dz * dt

      points.push({ x, y, z, age: 0 })
      if (points.length > maxPoints) points.shift()

      // Dibuja el atractor
      points.forEach(point => {
        const alpha = Math.max(0, 1 - point.age / maxPoints)
        point.age++
        const time = timestamp * 0.001
        const cosTheta = Math.cos(time * 0.3)
        const sinTheta = Math.sin(time * 0.3)
        const projX = point.x * cosTheta - point.z * sinTheta
        const projY = point.y
        const projZ = point.x * sinTheta + point.z * cosTheta
        const screenX = projX * 8 + width / 4
        const screenY = projY * 8 + height / 4
        const hue = (point.z * 10 + 270) % 360
        const brightness = Math.max(0.3, 0.8 - projZ * 0.02)
        ctx.fillStyle = `hsla(${hue}, 100%, ${brightness * 70}%, ${alpha})`
        ctx.beginPath()
        ctx.arc(screenX, screenY, Math.max(1, 3 - projZ * 0.1), 0, Math.PI * 2)
        ctx.fill()
      })

    

     

      animationRef.current = requestAnimationFrame(animate)
    }

    // Efecto Big Bang antes de iniciar la animación principal
    let startTimeout: number | undefined
    let bigBangFrame: number | undefined
    const bigBangDuration = 2500 // ms
    const bigBangStart = performance.now()

    const bigBang = (timestamp: number) => {
      if (!canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      const elapsed = timestamp - bigBangStart
      const progress = Math.min(elapsed / bigBangDuration, 1)
      setBigBangProgress(progress)
      // Centra la explosión donde inicia el atractor y el cúmulo de galaxias
      const cx = canvasRef.current.width / 4
      const cy = canvasRef.current.height / 4
      const maxRadius = Math.max(cx, cy) * 1.2
      const radius = progress * maxRadius
      // Opacidad: baja de 1 a 0.5 en el primer segundo, sube a 0.9 en el segundo 2, se mantiene en 0.9 hasta el segundo 5, luego desaparece
      let explosionAlpha = 1
      if (elapsed < 1000) {
        explosionAlpha = 1 - 0.5 * (elapsed / 1000)
      } else if (elapsed < 2000) {
        // Sube linealmente de 0.5 a 0.9 entre el segundo 1 y 2
        explosionAlpha = 0.5 + 0.5 * ((elapsed - 1000) / 1000)
      } else if (elapsed < 5000) {
        // Mantiene 0.9 entre el segundo 2 y 5
        explosionAlpha = 0.9
      } else if (elapsed < bigBangDuration) {
        // Baja linealmente de 0.9 a 0 entre el segundo 5 y el final
        explosionAlpha = 0.9 * (1 - (elapsed - 5000) / (bigBangDuration - 5000))
      } else {
        explosionAlpha = 0
      }
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, `rgba(255,255,200,${explosionAlpha})`)
      grad.addColorStop(0.3, `rgba(255,220,100,${explosionAlpha * 0.9})`)
      grad.addColorStop(0.7, `rgba(255,120,0,${explosionAlpha * 0.7})`)
      grad.addColorStop(1, `rgba(0,0,0,0)`)
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2
        const pr = radius * 0.2 + Math.random() * radius * 0.1
        const px = cx + Math.cos(angle) * pr
        const py = cy + Math.sin(angle) * pr
        ctx.fillStyle = `rgba(255,255,255,${(0.7 - progress * 0.5) * explosionAlpha})`
        ctx.beginPath()
        ctx.arc(px, py, 2 + Math.random() * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      if (progress < 1) {
        bigBangFrame = requestAnimationFrame(bigBang)
      }
    }
    bigBangFrame = requestAnimationFrame(bigBang)
    // Inicia la animación principal desde el segundo 1
    startTimeout = window.setTimeout(() => {
      initializeGrid()
      animationRef.current = requestAnimationFrame(animate)
    }, 2300)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (startTimeout) clearTimeout(startTimeout)
      if (bigBangFrame) cancelAnimationFrame(bigBangFrame)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div
        className="text-overlay"
        style={{
          top: '85%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: bigBangProgress > 0 ? (bigBangProgress < 0.4 ? 0 : (bigBangProgress - 0.4) / 0.6) : 1,
          position: 'absolute',
          fontSize: '2rem',
          fontFamily: 'Trebuchet MS, sans-serif',
          fontWeight: 600,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          transition: 'all 0.3s cubic-bezier(.7,.2,.3,1)',
        }}
      >
        Francisco Emmanuel Arias López
        <br />
        Licenciado en Multimedia y Animación digital
        <br />
        Facultad de Ciencias Físico Matemáticas
      </div>
      <style>{`
        .text-overlay {
          animation: goldenCycle 6s linear infinite, glowCycle 3s ease-in-out infinite;
        }
        @keyframes goldenCycle {
          0%   { color: #F5C242; }
          50%  { color: #FFD700; }
          100% { color: #FFEA00; }
        }
        @keyframes glowCycle {
          0%, 100% {
            text-shadow: 0 0 32px #FFD700, 0 0 64px #FFEA00;
          }
          25% {
            text-shadow: 0 0 48px #FFD700, 0 0 96px #FFEA00;
          }
          50% {
            text-shadow: 0 0 64px #FFD700, 0 0 128px #FFEA00;
          }
          75% {
            text-shadow: 0 0 48px #FFD700, 0 0 96px #FFEA00;
          }
        }
      `}</style>
    </div>
  )
}

export default CombinedSimulation
