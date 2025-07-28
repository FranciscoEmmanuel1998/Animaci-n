import { useEffect, useRef } from 'react';

export const ChaosAttractor = () => {
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

    // Lorenz Attractor Parameters
    const sigma = 10;
    const rho = 28;
    const beta = 8/3;
    const dt = 0.01;

    let x = 1, y = 1, z = 1;
    const points: { x: number; y: number; z: number; age: number }[] = [];
    const maxPoints = 2000;

    const animate = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, width/2, height/2);

      // Lorenz equations
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;

      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      // Add new point
      points.push({ x, y, z, age: 0 });
      if (points.length > maxPoints) {
        points.shift();
      }

      // Draw attractor with 3D projection
      points.forEach((point, index) => {
        const age = point.age++;
        const alpha = Math.max(0, 1 - age / maxPoints);
        
        // 3D to 2D projection with rotation
        const time = Date.now() * 0.001;
        const cosTheta = Math.cos(time * 0.3);
        const sinTheta = Math.sin(time * 0.3);
        
        const projX = point.x * cosTheta - point.z * sinTheta;
        const projY = point.y;
        const projZ = point.x * sinTheta + point.z * cosTheta;

        const screenX = (projX * 8) + width/4;
        const screenY = (projY * 8) + height/4;

        // Color based on position and depth
        const hue = (point.z * 10 + 270) % 360;
        const brightness = Math.max(0.3, 0.8 - projZ * 0.02);
        
        ctx.fillStyle = `hsla(${hue}, 100%, ${brightness * 70}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(1, 3 - projZ * 0.1), 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect for recent points
        if (index > maxPoints - 50) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
          ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

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
        style={{ filter: 'blur(0.5px)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-quantum-chaos/10 pointer-events-none" />
    </div>
  );
};