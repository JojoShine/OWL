
import { createContext, useContext, useState, useEffect } from "react"

const UIThemeContext = createContext(undefined)

export function UIThemeProvider({ children }) {
  const [uiTheme, setUITheme] = useState("shadcn")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("ui-theme") || "shadcn"
    setUITheme(stored)
  }, [])

  return (
    <UIThemeContext.Provider value={{ uiTheme, setUITheme, mounted }}>
      {children}
    </UIThemeContext.Provider>
  )
}

export function useUIThemeContext() {
  const context = useContext(UIThemeContext)
  if (!context) {
    throw new Error("useUIThemeContext must be used within UIThemeProvider")
  }
  return context
}
