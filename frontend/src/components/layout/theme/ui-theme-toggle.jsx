
import { Layout, Check, Info } from "lucide-react"
import { useUITheme } from "@/lib/utils/theme"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UIThemeToggle() {
  const { uiTheme, setUITheme, uiThemes, mounted } = useUITheme()

  // 避免水合不匹配
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Layout className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">选择 UI 主题</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Layout className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">选择 UI 主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {uiThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setUITheme(theme.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="flex-1">
              <div className="font-medium">{theme.label}</div>
              <div className="text-xs text-muted-foreground">{theme.description}</div>
              {theme.value === "antd" && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>将自动切换为 Light 模式</span>
                </div>
              )}
            </span>
            {uiTheme === theme.value && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
