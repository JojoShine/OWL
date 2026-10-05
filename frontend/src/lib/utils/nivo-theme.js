
import { useTheme } from "@/components/layout/theme/theme-provider"
import { useEffect, useState } from "react"

/**
 * 从 DOM 读取 CSS 变量值
 * @param {string} variable - CSS 变量名（如 '--primary'）
 * @returns {string} - CSS 变量值
 */
const getCSSVariable = (variable) => {
  if (typeof document === 'undefined') return '#000'

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()

  return value || '#000'
}

/**
 * 将 oklch 颜色转换为 hex
 * oklch 格式：oklch(L C H) 其中 L=lightness, C=chroma, H=hue
 * 这个简化版本返回原始值，Nivo 会自动处理
 */
const normalizeColor = (color) => {
  // 如果已经是 hex 或其他格式，直接返回
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
    return color
  }
  // oklch 格式的颜色也可以直接用
  return color
}

/**
 * 获取 Nivo 主题配置
 * @returns {object} - Nivo 主题对象
 */
export const getNivoTheme = () => {
  const textColor = getCSSVariable('--foreground')
  const borderColor = getCSSVariable('--border')
  const mutedForeground = getCSSVariable('--muted-foreground')
  const popoverBg = getCSSVariable('--popover')
  const popoverForeground = getCSSVariable('--popover-foreground')

  return {
    background: 'transparent',
    textColor: textColor,
    fontSize: 12,
    fontFamily: 'inherit',
    axis: {
      domain: {
        line: {
          stroke: borderColor,
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: textColor,
        },
      },
      ticks: {
        line: {
          stroke: borderColor,
          strokeWidth: 1,
        },
        text: {
          fontSize: 12,
          fill: mutedForeground,
        },
      },
    },
    grid: {
      line: {
        stroke: borderColor,
        strokeWidth: 0.5,
        strokeDasharray: '0',
      },
    },
    legends: {
      text: {
        fill: textColor,
        fontSize: 12,
      },
    },
    labels: {
      text: {
        fontSize: 12,
        fill: textColor,
      },
    },
    markers: {
      lineColor: textColor,
      lineStrokeWidth: 1,
      text: {
        fill: textColor,
        fontSize: 11,
      },
    },
    tooltip: {
      container: {
        background: popoverBg,
        color: popoverForeground,
        fontSize: 12,
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '8px 12px',
      },
      basic: {},
      chip: {},
      table: {},
      tableCell: {},
      tableCellValue: {},
    },
    crosshair: {
      line: {
        stroke: textColor,
        strokeWidth: 1,
        strokeOpacity: 0.35,
        strokeDasharray: '6 6',
      },
    },
  }
}

/**
 * React Hook - 获取响应式的 Nivo 主题
 * 当主题切换时自动更新
 * @returns {object|null} - Nivo 主题对象或 null（初始化中）
 */
export const useNivoTheme = () => {
  const { theme } = useTheme()
  const [nivoTheme, setNivoTheme] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // 主题切换时重新读取 CSS 变量
    const newTheme = getNivoTheme()
    setNivoTheme(newTheme)
  }, [theme, mounted])

  return { nivoTheme, mounted }
}

/**
 * 从 CSS 变量获取主题色
 * @returns {string} - 主题色（hex 格式）
 */
export const getPrimaryColor = () => {
  return getCSSVariable('--primary')
}

/**
 * 获取 Nivo 图表的色彩数组
 * @returns {array} - 颜色数组
 */
export const getNivoColors = () => {
  return [
    getPrimaryColor(),
    '#3b82f6',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
  ]
}

/**
 * 获取 Pie Chart 优化的色彩数组（浅色和深色模式都适配）
 * @returns {array} - 鲜艳度更高的颜色数组
 */
export const getPieChartColors = () => {
  return [
    '#3b82f6',  // Blue
    '#ef4444',  // Red
    '#10b981',  // Emerald
    '#f59e0b',  // Amber
    '#8b5cf6',  // Violet
    '#06b6d4',  // Cyan
    '#ec4899',  // Pink
    '#14b8a6',  // Teal
  ]
}
