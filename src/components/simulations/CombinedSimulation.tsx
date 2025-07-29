import { useEffect, useRef } from 'react'

/**
 * Combines the cellular automaton and Lorenz attractor into a single
 * animation loop. The automaton grid is drawn first and the attractor
 * points are rendered on top.
 */
const CombinedSimulation = () => {
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

    /* -------------------- Cellular Automaton -------------------- */
    const cellSize = 4
    const cols = Math.floor(width / cellSize / 2)
    const rows = Math.floor(height / cellSize / 2)

    let currentGeneration: number[][] = []
    let nextGeneration: number[][] = []
    let generation = 0

    const initializeGrid = () => {
      currentGeneration = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(0))
      nextGeneration = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(0))

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const centerX = cols / 2
          const centerY = rows / 2
          const distance = Math.sqrt(
            (col - centerX) ** 2 + (row - centerY) ** 2,
          )

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

    /* ---------------------- Lorenz Attractor -------------------- */
    const sigma = 10
    const rho = 28
    const beta = 8 / 3
    const dt = 0.01

    let x = 1,
      y = 1,
      z = 1
    const points: { x: number; y: number; z: number; age: number }[] = []
    const maxPoints = 2000

    /* -------------------------- Animation ----------------------- */
    let lastUpdate = 0
    const updateInterval = 100

    const animate = (timestamp: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(0, 0, width / 2, height / 2)

      if (timestamp - lastUpdate > updateInterval) {
        updateGeneration()
        lastUpdate = timestamp
      }

      // Draw cellular automaton first
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (currentGeneration[row][col] === 1) {
            const neighbors = countNeighbors(row, col)
            const xPos = col * cellSize
            const yPos = row * cellSize
            const hue = (220 + neighbors * 30 + generation * 0.5) % 360
            const saturation = 70 + neighbors * 10
            const lightness = 60 +
              Math.sin(generation * 0.1 + row * 0.1 + col * 0.1) * 20
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            ctx.fillRect(xPos, yPos, cellSize, cellSize)
          }
        }
      }

      // Lorenz attractor step
      const dx = sigma * (y - x)
      const dy = x * (rho - z) - y
      const dz = x * y - beta * z
      x += dx * dt
      y += dy * dt
      z += dz * dt

      points.push({ x, y, z, age: 0 })
      if (points.length > maxPoints) points.shift()

      // Draw attractor on top
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

    initializeGrid()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-quantum-chaos/10 pointer-events-none" />
    </div>
  )
}

export default CombinedSimulation
