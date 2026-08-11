'use client';
import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export default function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const dots: { x: number; y: number; baseX: number; baseY: number }[] = [];
    const SPACING = 30;
    
    // Mouse state
    let mouseX = -1000;
    let mouseY = -1000;

    const initDots = () => {
      dots.length = 0;
      for (let x = 0; x < width; x += SPACING) {
        for (let y = 0; y < height; y += SPACING) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    handleResize();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const currentTheme = resolvedTheme || theme;
      const isDark = currentTheme === 'dark';
      
      // We will draw dots
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

      const hoverRadius = 100;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Calculate distance to mouse
        const dx = mouseX - dot.baseX;
        const dy = mouseY - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let size = 1.5;
        let drawX = dot.baseX;
        let drawY = dot.baseY;

        // Interaction
        if (dist < hoverRadius) {
          // Increase size based on proximity
          const force = (hoverRadius - dist) / hoverRadius;
          size = 1.5 + force * 2;
          
          // Slight repel
          const repelDist = force * 5;
          const angle = Math.atan2(dy, dx);
          drawX -= Math.cos(angle) * repelDist;
          drawY -= Math.sin(angle) * repelDist;
        }

        // Draw dot
        ctx.beginPath();
        ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
    />
  );
}
