'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function ExecutivePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawChart = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tick: number) => {
    const liveData = {
      revenue: [62, 68, 71, 75, 73, 80, 84, 79, 88, 92, 87, 95],
      ops: [44, 50, 47, 55, 52, 60, 58, 66, 63, 71, 68, 76],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    };

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pts1 = liveData.revenue;
    const pts2 = liveData.ops;
    const pad = { l: 8, r: 8, t: 10, b: 20 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;
    const maxV = 110;
    const xPos = (i: number) => pad.l + (i / (pts1.length - 1)) * chartW;
    const yPos = (v: number) => pad.t + chartH - (v / maxV) * chartH;
    const waveOffset = Math.sin(tick * 0.015) * 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    // Ops area
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(pts2[0] + waveOffset));
    for (let i = 1; i < pts2.length; i++) {
      const cx = xPos(i - 0.5);
      ctx.bezierCurveTo(cx, yPos(pts2[i - 1] + waveOffset), cx, yPos(pts2[i] + waveOffset), xPos(i), yPos(pts2[i] + waveOffset));
    }
    ctx.lineTo(xPos(pts2.length - 1), h);
    ctx.lineTo(xPos(0), h);
    ctx.closePath();
    const g2 = ctx.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(239,101,38,0.18)');
    g2.addColorStop(1, 'rgba(239,101,38,0)');
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(pts2[0] + waveOffset));
    for (let i = 1; i < pts2.length; i++) {
      const cx = xPos(i - 0.5);
      ctx.bezierCurveTo(cx, yPos(pts2[i - 1] + waveOffset), cx, yPos(pts2[i] + waveOffset), xPos(i), yPos(pts2[i] + waveOffset));
    }
    ctx.strokeStyle = '#ef6526';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Revenue area
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(pts1[0] - waveOffset));
    for (let i = 1; i < pts1.length; i++) {
      const cx = xPos(i - 0.5);
      ctx.bezierCurveTo(cx, yPos(pts1[i - 1] - waveOffset), cx, yPos(pts1[i] - waveOffset), xPos(i), yPos(pts1[i] - waveOffset));
    }
    ctx.lineTo(xPos(pts1.length - 1), h);
    ctx.lineTo(xPos(0), h);
    ctx.closePath();
    const g1 = ctx.createLinearGradient(0, 0, 0, h);
    g1.addColorStop(0, 'rgba(69,132,237,0.25)');
    g1.addColorStop(1, 'rgba(69,132,237,0)');
    ctx.fillStyle = g1;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(pts1[0] - waveOffset));
    for (let i = 1; i < pts1.length; i++) {
      const cx = xPos(i - 0.5);
      ctx.bezierCurveTo(cx, yPos(pts1[i - 1] - waveOffset), cx, yPos(pts1[i] - waveOffset), xPos(i), yPos(pts1[i] - waveOffset));
    }
    ctx.strokeStyle = '#4584ed';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Animated dot
    const dp = (Math.sin(tick * 0.05) + 1) / 2;
    const dotX = xPos(pts1.length - 1);
    const dotY = yPos(pts1[pts1.length - 1] - waveOffset);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4 + dp * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(69,132,237,${0.15 + dp * 0.15})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4584ed';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '9px "Roboto Slab",sans-serif';
    ctx.textAlign = 'center';
    [0, 3, 6, 9, 11].forEach((i) => ctx.fillText(liveData.labels[i], xPos(i), h - 5));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    let animId: number;

    function resizeCanvas() {
      const parent = canvas!.parentElement;
      if (parent) {
        canvas!.width = parent.offsetWidth;
        canvas!.height = parent.offsetHeight;
      }
    }

    function animate() {
      tick++;
      drawChart(ctx!, canvas!, tick);
      animId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawChart]);

  useEffect(() => {
    const feedItems = [
      'Q3 variance 12% above threshold — Lagos logistics. Recommend board review.',
      'Procurement approval auto-routed — 4 sec',
      'Board report generated — Finance Dept',
      'New data source connected — HR System',
      'Copilot insight: Recommend cost review in Ops',
      'Power Automate flow executed — 847 records',
      'Revenue forecast updated — +18% vs Q2',
      'Anomaly detected — Supply Chain delay flagged',
    ];
    let feedIdx = 0;

    const interval = setInterval(() => {
      const el = feedRef.current;
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => {
        feedIdx = (feedIdx + 1) % feedItems.length;
        el.textContent = feedItems[feedIdx];
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = revenueRef.current;
      if (r) {
        const v = 17 + Math.floor(Math.random() * 3);
        r.textContent = `+${v}%`;
      }
      const s = sourcesRef.current;
      if (s) {
        s.textContent = ['12 live', '13 live', '12 live'][Math.floor(Math.random() * 3)];
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hero-panel-wrap">
      <div className="micro-card micro-card-1">
        <span className="micro-dot green"></span>Power BI Connected
      </div>
      <div className="micro-card micro-card-2">
        <span className="micro-dot blue"></span>Azure Pipeline Active
      </div>
      <div className="micro-card micro-card-3">
        <span className="micro-dot orange"></span>Copilot Running
      </div>

      <div className="exec-panel">
        <div className="exec-panel-header">
          <div>
            <div className="exec-panel-title">Executive Intelligence Panel</div>
            <div className="exec-panel-sub">Powered by Microsoft Copilot · Azure</div>
          </div>
          <div className="exec-live-badge">
            <span className="exec-live-dot"></span>LIVE
          </div>
        </div>

        <div className="exec-metrics-row">
          <div className="exec-metric-cell">
            <div className="exec-metric-label">Revenue Growth</div>
            <div className="exec-metric-value green" ref={revenueRef}>+18%</div>
            <div className="exec-metric-sub">↑ vs last quarter</div>
          </div>
          <div className="exec-metric-cell">
            <div className="exec-metric-label">Active Alerts</div>
            <div className="exec-metric-value amber">3 alerts</div>
            <div className="exec-metric-sub">Risk: Low</div>
          </div>
          <div className="exec-metric-cell">
            <div className="exec-metric-label">Data Sources</div>
            <div className="exec-metric-value blue" ref={sourcesRef}>12 live</div>
            <div className="exec-metric-sub">All synced</div>
          </div>
        </div>

        <div className="exec-chart-wrap">
          <div className="exec-chart-header">
            <div className="exec-chart-title">Performance Index — 12 Months</div>
            <div className="exec-chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#4584ed' }}></div>Revenue
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#ef6526' }}></div>Ops
              </div>
            </div>
          </div>
          <canvas id="dashboardChart" ref={canvasRef}></canvas>
        </div>

        <div className="exec-feed">
          <div className="exec-feed-label">Agent Activity Feed</div>
          <div className="exec-feed-item">
            <div className="exec-feed-icon">✦</div>
            <div className="exec-feed-text" ref={feedRef}>
              Q3 variance 12% above threshold — Lagos logistics. Recommend board review.
            </div>
          </div>
        </div>

        <div className="exec-actions-row">
          <button className="exec-action-btn primary" onClick={() => scrollTo('#discovery')}>
            Request Briefing
          </button>
          <button className="exec-action-btn ghost" onClick={() => scrollTo('#how')}>
            View Pipeline →
          </button>
        </div>
      </div>
    </div>
  );
}
