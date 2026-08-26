'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMenuIcon, commonIcons } from '@/lib/config/menu-icons';
import { Search, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * 图标选择器组件
 * @param {Object} props
 * @param {string} props.value - 当前选中的图标名称
 * @param {Function} props.onChange - 图标变化回调
 * @param {string} props.placeholder - 输入框占位符
 */
export function IconPicker({ value, onChange, placeholder = '请选择图标' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customIcon, setCustomIcon] = useState(value || '');

  // 过滤图标列表
  const filteredIcons = useMemo(() => {
    if (!search) return commonIcons;
    const searchLower = search.toLowerCase();
    return commonIcons.filter(icon =>
      icon.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // 选择图标
  const handleSelect = (iconName) => {
    onChange?.(iconName);
    setCustomIcon(iconName);
    setOpen(false);
    setSearch('');
  };

  // 使用自定义图标
  const handleUseCustom = () => {
    if (customIcon) {
      onChange?.(customIcon);
      setOpen(false);
      setSearch('');
    }
  };

  // 渲染当前选中的图标
  const SelectedIcon = value ? getMenuIcon(value) : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start"
          onClick={() => setOpen(true)}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4 mr-2" />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange?.('')}
          >
            清除
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>选择图标</DialogTitle>
            <DialogDescription>
              从常用图标中选择，或输入自定义图标名称
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索图标..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* 自定义图标输入 */}
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">自定义图标名称</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="例如：Home, Users, Settings"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUseCustom}
                  disabled={!customIcon}
                >
                  使用
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>参考</span>
                <a
                  href="https://lucide.dev/icons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Lucide Icons 图标库
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* 图标网格 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                常用图标 ({filteredIcons.length})
              </Label>
              <ScrollArea className="h-[400px] border rounded-lg p-2">
                {filteredIcons.length === 0 ? (
                  <EmptyState icon={Search} title="未找到匹配的图标" compact />
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {filteredIcons.map((iconName) => {
                      const Icon = getMenuIcon(iconName);
                      const isSelected = value === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => handleSelect(iconName)}
                          className={`
                            flex flex-col items-center justify-center gap-1 p-3 rounded-lg
                            border transition-colors hover:bg-accent
                            ${isSelected ? 'bg-primary text-primary-foreground border-primary' : ''}
                          `}
                          title={iconName}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[10px] truncate w-full text-center">
                            {iconName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
