'use client'

import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'

const CHART_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']
let colorContext

// ECharts 的 zrender 不识别 oklch/color-mix 等 CSS Color 4 语法，
// 通过浏览器 Canvas 将主题色统一转换为其支持的 RGBA。
const toEChartsColor = (color) => {
  if (!color || typeof document === 'undefined') return color
  if (typeof CSS !== 'undefined' && !CSS.supports('color', color)) return color

  if (!colorContext) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    colorContext = canvas.getContext('2d', { willReadFrequently: true })
  }

  if (!colorContext) return color

  colorContext.clearRect(0, 0, 1, 1)
  colorContext.fillStyle = color
  colorContext.fillRect(0, 0, 1, 1)

  const [red, green, blue, alpha] = colorContext.getImageData(0, 0, 1, 1).data
  return `rgba(${red}, ${green}, ${blue}, ${Number((alpha / 255).toFixed(3))})`
}

// 从当前主题的 CSS 变量中读取浏览器已经解析的颜色值。
const getTailwindColor = (variable) => {
  if (typeof document === 'undefined') return ''

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()

  return toEChartsColor(color)
}

// 饼图使用全局图表色，确保深浅主题和品牌主题使用同一套色阶。
const getPieColors = () => (
  CHART_COLORS.map(getTailwindColor)
    .filter(Boolean)
)

/**
 * Dashboard Card Component
 * 使用 ECharts 图表库，支持多种图表类型
 * Modes: 'line', 'bar', 'area', 'pie'
 */
function DashboardCard({
  title,
  data,
  mode = 'line',
  dataKey = 'value',
  xKey = 'name',
  hideTitle = false,
  unit = '',
}) {
  const { resolvedTheme } = useTheme()
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [rootThemeVersion, setRootThemeVersion] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    let frameId

    const refreshTheme = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        setRootThemeVersion(version => version + 1)
      })
    }

    const observer = new MutationObserver(refreshTheme)

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    refreshTheme()

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frameId)
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return

    // 主题切换时销毁旧实例
    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }

    // 创建新的图表实例，不使用预设主题，而是自定义
    chartInstance.current = echarts.init(chartRef.current)

    // 设置图表背景色为透明，让卡片背景显示
    chartInstance.current.setOption({
      backgroundColor: 'transparent'
    })

    const textColor = getTailwindColor('--foreground')
    const mutedTextColor = getTailwindColor('--muted-foreground')
    const borderColor = getTailwindColor('--border')
    const popoverColor = getTailwindColor('--popover')
    const popoverTextColor = getTailwindColor('--popover-foreground')
    const primaryColor = getTailwindColor('--primary')
    const chartSurfaceColor = getTailwindColor('--card') || getTailwindColor('--background')

    const tooltipStyle = {
      backgroundColor: popoverColor,
      textStyle: { color: popoverTextColor },
      borderColor,
      borderWidth: 1,
    }

    let option = {}

    if (mode === 'line') {
      option = {
        color: [primaryColor],
        tooltip: {
          trigger: 'axis',
          ...tooltipStyle,
        },
        grid: {
          left: 60,
          right: 30,
          top: 10,
          bottom: 30,
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item[xKey]),
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { lineStyle: { color: borderColor } },
        },
        series: [
          {
            data: data.map(item => item[dataKey]),
            type: 'line',
            smooth: true,
            lineStyle: { width: 3, color: primaryColor },
            itemStyle: { borderWidth: 2, borderColor: primaryColor },
            symbolSize: 6,
          },
        ],
      }
    } else if (mode === 'area') {
      option = {
        color: [primaryColor],
        tooltip: {
          trigger: 'axis',
          ...tooltipStyle,
        },
        grid: {
          left: 60,
          right: 30,
          top: 10,
          bottom: 30,
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item[xKey]),
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { lineStyle: { color: borderColor } },
        },
        series: [
          {
            data: data.map(item => item[dataKey]),
            type: 'line',
            smooth: true,
            areaStyle: { color: primaryColor, opacity: 0.18 },
            lineStyle: { width: 3, color: primaryColor },
            itemStyle: { borderWidth: 2, borderColor: primaryColor },
            symbolSize: 6,
          },
        ],
      }
    } else if (mode === 'bar') {
      option = {
        color: [primaryColor],
        tooltip: {
          trigger: 'axis',
          ...tooltipStyle,
        },
        grid: {
          left: 60,
          right: 30,
          top: 10,
          bottom: 30,
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item[xKey]),
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: mutedTextColor },
          splitLine: { lineStyle: { color: borderColor } },
        },
        series: [
          {
            data: data.map(item => item[dataKey]),
            type: 'bar',
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: primaryColor,
            },
            emphasis: {
              disabled: true,
            },
          },
        ],
      }
    } else if (mode === 'pie') {
      // 获取饼图颜色（动态获取主题色）
      const pieColors = getPieColors()

      option = {
        color: pieColors,
        tooltip: {
          trigger: 'item',
          ...tooltipStyle,
        },
        legend: {
          bottom: 0,
          left: 'center',
          textStyle: { color: textColor },
        },
        series: [
          {
            data: data.map((item, index) => {
              const pieColor = pieColors[index % pieColors.length]
              return {
                name: item[xKey],
                value: item[dataKey],
                itemStyle: {
                  color: pieColor,
                  borderColor: chartSurfaceColor,
                  borderWidth: 2,
                },
              }
            }),
            type: 'pie',
            radius: ['40%', '70%'],
            emphasis: {
              scale: false,
            },
            label: {
              color: textColor,
            },
          },
        ],
      }
    }

    chartInstance.current.setOption(option)

    // 清理函数：当组件卸载或主题改变时销毁图表
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [data, mode, dataKey, xKey, rootThemeVersion])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 检查数据是否为空
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <Card className="gap-3 py-4 shadow-none lg:h-full lg:min-h-0">
        {!hideTitle && (
          <CardHeader className="px-4">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={`${hideTitle ? 'px-4 pt-4' : 'px-4'} lg:min-h-0 lg:flex-1`}>
          <div
            className="flex h-60 items-center justify-center text-muted-foreground lg:h-full lg:min-h-0"
          >
            暂无数据
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-3 py-4 shadow-none lg:h-full lg:min-h-0">
      {!hideTitle && (
        <CardHeader className="px-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={`${hideTitle ? 'px-4 pt-4' : 'px-4'} lg:min-h-0 lg:flex-1`}>
        <div ref={chartRef} className="h-60 lg:h-full lg:min-h-0" />
      </CardContent>
    </Card>
  )
}

export default DashboardCard
