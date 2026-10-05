import * as React from "react"
import { Select } from "antd"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import "./antd-controls.css"

export function Combobox({ options = [], value, onChange, placeholder = "请选择...", searchPlaceholder = "搜索...", emptyText = "未找到结果", className, disabled = false }) {
  return <Select
    className={cn("owl-select w-full", className)}
    virtual={false}
    showSearch={{ optionFilterProp: "label" }}
    aria-label={searchPlaceholder}
    options={options}
    value={value || undefined}
    placeholder={placeholder}
    disabled={disabled}
    allowClear
    onChange={(next) => onChange?.(next ?? "")}
    onSelect={(next) => { if (next === value) onChange?.(""); }}
    notFoundContent={<EmptyState title={emptyText} compact className="py-6" />}
  />;
}
