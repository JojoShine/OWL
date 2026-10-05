
import React, { useState, useEffect } from 'react';

// XML 转义函数，防止特殊字符破坏 SVG 结构
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 格式化时间戳（精确到分钟）
function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function Watermark({
  lines = [],
  fontSize = 24,
  fontWeight = '400',
  color = '#000000',
  opacity = 0.1,
  rotation = 45,
  spacing = 150,
  enabled = true,
}) {
  const [isDark, setIsDark] = useState(false);
  const [currentTime, setCurrentTime] = useState(formatTimestamp());

  // 检测暗黑模式
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // 每分钟更新时间戳
  useEffect(() => {
    // 计算距离下一分钟的毫秒数
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // 首次在下一分钟开始时更新
    const initialTimeout = setTimeout(() => {
      setCurrentTime(formatTimestamp());

      // 之后每60秒更新一次
      const interval = setInterval(() => {
        setCurrentTime(formatTimestamp());
      }, 60000);

      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  if (!enabled) {
    return null;
  }

  // 根据暗黑模式调整颜色
  let watermarkColor = color;
  if (isDark && color === '#000000') {
    watermarkColor = '#ffffff';
  } else if (!isDark && color === '#ffffff') {
    watermarkColor = '#000000';
  }

  // 合并所有行为单个文本，并添加时间戳
  const allLines = [...lines.filter(l => l), currentTime];
  const watermarkText = allLines.join('\n') || '水印';

  // 计算文本所需的大概宽度（每个字符约占 fontSize * 0.6 的宽度）
  const maxLineLength = Math.max(...allLines.map(line => line.length), 1);
  const estimatedTextWidth = maxLineLength * fontSize * 0.6;
  const textHeight = allLines.length * fontSize * 1.2;

  // SVG 宽度取 spacing 和估计文本宽度的较大值，加上一些padding
  const svgWidth = Math.max(spacing, estimatedTextWidth + fontSize * 2);
  const svgHeight = Math.max(spacing, textHeight + fontSize * 2);

  // 生成简单的 SVG - 宽度根据内容自适应
  const svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <text
        x="${svgWidth / 2}"
        y="${svgHeight / 2}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${fontSize}"
        font-weight="${fontWeight}"
        fill="${watermarkColor}"
        opacity="${opacity}"
        font-family="Arial, sans-serif"
        transform="rotate(${rotation} ${svgWidth / 2} ${svgHeight / 2})"
      >
        ${watermarkText.split('\n').map((line, i) =>
          `<tspan x="${svgWidth / 2}" dy="${i === 0 ? '0' : fontSize * 1.2}">${escapeXml(line)}</tspan>`
        ).join('')}
      </text>
    </svg>
  `;

  const encodedSvg = encodeURIComponent(svgContent);
  const svgDataUri = `data:image/svg+xml;utf8,${encodedSvg}`;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: `url('${svgDataUri}')`,
        backgroundRepeat: `repeat`,
        backgroundSize: `${svgWidth}px ${svgHeight}px`,
        backgroundPosition: '0 0',
        zIndex: 99999,
      }}
      aria-hidden="true"
    />
  );
}

export default Watermark;
