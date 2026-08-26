"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * 可检索的下拉选择组件（Combobox）
 *
 * @param {Object} props
 * @param {Array} props.options - 选项数组 [{ value: string, label: string }]
 * @param {string} props.value - 当前选中的值
 * @param {Function} props.onChange - 值变化回调
 * @param {string} props.placeholder - 占位符文本
 * @param {string} props.searchPlaceholder - 搜索框占位符
 * @param {string} props.emptyText - 无结果时的提示文本
 * @param {string} props.className - 自定义样式类
 * @param {boolean} props.disabled - 是否禁用
 */
export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "请选择...",
  searchPlaceholder = "搜索...",
  emptyText = "未找到结果",
  className,
  disabled = false
}) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  // 查找当前选中项的标签
  const selectedLabel = React.useMemo(() => {
    const selected = options.find((option) => option.value === value)
    return selected ? selected.label : placeholder
  }, [options, value, placeholder])

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const handleSelect = (selectedValue) => {
    onChange(selectedValue === value ? "" : selectedValue)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* 搜索框 */}
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>

          {/* 选项列表 */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
