"use client"

import { useCallback, useEffect, useState } from "react"

const COLOR_THEMES = [
  { value: "default", label: "默认", color: "oklch(0.5 0 0)" },
  { value: "blue", label: "蓝色", color: "oklch(0.55 0.18 250)" },
  { value: "green", label: "绿色", color: "oklch(0.55 0.16 140)" },
  { value: "purple", label: "紫色", color: "oklch(0.55 0.18 290)" },
  { value: "orange", label: "橙色", color: "oklch(0.60 0.18 50)" },
  { value: "red", label: "红色", color: "oklch(0.55 0.20 20)" },
  { value: "cyan", label: "青色", color: "oklch(0.60 0.16 200)" },
]

const STORAGE_KEY = "color-theme"
const SYSTEM_CONFIG_KEY = "system-config-theme"

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState("default")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 从 localStorage 读取主题色（优先使用系统配置，其次使用本地存储）
    const systemConfigTheme = localStorage.getItem(SYSTEM_CONFIG_KEY)
    const stored = localStorage.getItem(STORAGE_KEY)

    if (systemConfigTheme && COLOR_THEMES.find(t => t.value === systemConfigTheme)) {
      setColorTheme(systemConfigTheme)
    } else if (stored && COLOR_THEMES.find(t => t.value === stored)) {
      setColorTheme(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // 移除所有主题色 class
    COLOR_THEMES.forEach(theme => {
      if (theme.value !== "default") {
        root.classList.remove(`theme-${theme.value}`)
      }
    })

    // 添加当前主题色 class（默认主题不需要添加 class）
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`)
    }

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, colorTheme)
  }, [colorTheme, mounted])

  const applySystemConfigTheme = useCallback((themeColor) => {
    // 从系统配置应用主题色
    if (themeColor && COLOR_THEMES.find(t => t.value === themeColor)) {
      localStorage.setItem(SYSTEM_CONFIG_KEY, themeColor)
      setColorTheme(themeColor)
    }
  }, [])

  return {
    colorTheme,
    setColorTheme,
    applySystemConfigTheme,
    colorThemes: COLOR_THEMES,
    mounted,
  }
}
