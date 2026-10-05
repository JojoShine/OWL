
import { Palette, RotateCcw } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { SCENE_THEMES } from '@/lib/theme/presets';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ColorThemeToggle() {
  const { sceneTheme, setSceneTheme, resetSceneTheme, mounted, isPersonal } = useAppearance();
  const current = SCENE_THEMES.find((scene) => scene.value === sceneTheme);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!mounted} aria-label={`应用场景：${current.label}`} title={`应用场景：${current.label}`} className="text-muted-foreground hover:text-foreground">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2"><p className="text-sm font-medium">应用场景</p><p className="mt-1 text-xs text-muted-foreground">选择适合当前项目的视觉主题</p></div>
        <DropdownMenuRadioGroup value={sceneTheme} onValueChange={setSceneTheme}>
          {SCENE_THEMES.map((scene) => (
            <DropdownMenuRadioItem key={scene.value} value={scene.value} className="gap-3 py-2.5">
              <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-md border border-black/5" style={{ backgroundColor: scene.color }} />
              <span><span className="block font-medium">{scene.label}</span><span className="block text-xs text-muted-foreground">{scene.description}</span></span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!isPersonal} onSelect={resetSceneTheme}><RotateCcw className="h-4 w-4" />恢复项目默认</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
