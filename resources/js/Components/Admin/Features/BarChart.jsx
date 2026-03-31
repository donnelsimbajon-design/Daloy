import { useEffect, useRef } from 'react';

export default function BarChart({ data, labels, height = 220 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = height;
        const padding = { top: 20, right: 20, bottom: 40, left: 10 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Find max value across all series
        const allValues = data.flatMap(series => series.values);
        const maxVal = Math.max(...allValues) * 1.15;

        // Grid lines
        const gridLines = 4;
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        // Bars
        const seriesCount = data.length;
        const groupCount = data[0].values.length;
        const groupWidth = chartW / groupCount;
        const barWidth = Math.min((groupWidth * 0.6) / seriesCount, 24);
        const totalBarGroupWidth = barWidth * seriesCount + (seriesCount - 1) * 2;

        const colors = ['#111111', '#888888', '#cccccc'];

        data.forEach((series, sIdx) => {
            series.values.forEach((val, gIdx) => {
                const barH = (val / maxVal) * chartH;
                const groupX = padding.left + gIdx * groupWidth + (groupWidth - totalBarGroupWidth) / 2;
                const x = groupX + sIdx * (barWidth + 2);
                const y = padding.top + chartH - barH;

                ctx.fillStyle = colors[sIdx % colors.length];
                ctx.beginPath();

                // Rounded top corners
                const r = 3;
                ctx.moveTo(x, y + r);
                ctx.arcTo(x, y, x + barWidth, y, r);
                ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, r);
                ctx.lineTo(x + barWidth, padding.top + chartH);
                ctx.lineTo(x, padding.top + chartH);
                ctx.closePath();
                ctx.fill();
            });
        });

        // X-axis labels
        ctx.fillStyle = '#999';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const x = padding.left + i * groupWidth + groupWidth / 2;
            ctx.fillText(label, x, h - 10);
        });

    }, [data, labels, height]);

    return (
        <div className="adm-chart-container" style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
