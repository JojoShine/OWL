import * as React from "react"
import { Switch as AntSwitch } from "antd"
export function Switch({ onCheckedChange, onChange, ...props }) {
  return <AntSwitch data-slot="switch" size="small" {...props} onChange={(checked, event) => { onCheckedChange?.(checked); onChange?.(checked, event); }} />;
}
