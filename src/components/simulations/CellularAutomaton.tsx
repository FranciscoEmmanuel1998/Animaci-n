import { useEffect, useRef } from 'react';

export const CellularAutomaton = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const cellSize = 4;
    const cols = Math.floor(width / cellSize / 2);
    const rows = Math.floor(height / cellSize / 2);
    
    let currentGeneration: number[][] = [];
    let nextGeneration: number[][] = [];
    let generation = 0;

    // Initialize grid
    const initializeGrid = () => {
      currentGeneration = Array(rows).fill(null).map(() => Array(cols).fill(0));
      nextGeneration = Array(rows).fill(null).map(() => Array(cols).fill(0));
      
      // Create initial pattern - mix of random and structured
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Create interesting starting patterns
          const centerX = cols / 2;
          const centerY = rows / 2;
          const distance = Math.sqrt((col - centerX) ** 2 + (row - centerY) ** 2);
          
          if (distance < 20) {
            currentGeneration[row][col] = Math.random() > 0.6 ? 1 : 0;
          } else if (Math.random() > 0.95) {
            currentGeneration[row][col] = 1;
          }
        }
      }
    };

    // Conway's Game of Life rules with variations
    const updateGeneration = () => {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const neighbors = countNeighbors(row, col);
          const currentCell = currentGeneration[row][col];
          
          // Classic Conway rules with philosophical variations
          if (currentCell === 1) {
            // Live cell
            if (neighbors < 2) {
              nextGeneration[row][col] = 0; // Underpopulation
            } else if (neighbors === 2 || neighbors === 3) {
              nextGeneration[row][col] = 1; // Survival
            } else {
              nextGeneration[row][col] = 0; // Overpopulation
            }
          } else {
            // Dead cell
            if (neighbors === 3) {
              nextGeneration[row][col] = 1; // Birth
            } else {
              nextGeneration[row][col] = 0; // Remains dead
            }
          }
          
          // Add philosophical mutation for artistic patterns
          if (generation % 100 === 0 && Math.random() > 0.998) {
            nextGeneration[row][col] = 1 - nextGeneration[row][col];
          }
        }
      }
      
      // Swap generations
      [currentGeneration, nextGeneration] = [nextGeneration, currentGeneration];
      generation++;
      
      // Reset if pattern becomes static or empty
      if (generation % 500 === 0) {
        initializeGrid();
        generation = 0;
      }
    };

    const countNeighbors = (row: number, col: number): number => {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          
          const newRow = (row + i + rows) % rows;
          const newCol = (col + j + cols) % cols;
          count += currentGeneration[newRow][newCol];
        }
      }
      return count;
    };

    let lastUpdate = 0;
    const updateInterval = 100; // ms

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdate > updateInterval) {
        updateGeneration();
        lastUpdate = timestamp;
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width/2, height/2);

      // Draw cells with artistic enhancement
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (currentGeneration[row][col] === 1) {
            const x = col * cellSize;
            const y = row * cellSize;
            
            // Calculate cell age and neighborhood density for coloring
            const neighbors = countNeighbors(row, col);
            const hue = (220 + neighbors * 30 + generation * 0.5) % 360;
            const saturation = 70 + neighbors * 10;
            const lightness = 60 + Math.sin(generation * 0.1 + row * 0.1 + col * 0.1) * 20;
            
            // Draw cell with glow effect
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fillRect(x, y, cellSize, cellSize);
            
            // Add glow for dense areas
            if (neighbors > 4) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
              ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.5)`;
              ctx.fillRect(x - 1, y - 1, cellSize + 2, cellSize + 2);
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      // Draw generation counter as subtle pattern
      if (generation % 10 === 0) {
        ctx.fillStyle = `hsla(220, 100%, 65%, 0.1)`;
        ctx.fillRect(0, 0, width/2, 2);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    initializeGrid();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-quantum-blue/10 to-transparent pointer-events-none" />
    </div>
  );
};