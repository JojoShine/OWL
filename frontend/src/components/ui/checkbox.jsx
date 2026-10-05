import * as React from "react"
import { Checkbox as AntCheckbox } from "antd"
import { cn } from "@/lib/utils"
export const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, onChange, ...props }, ref) => (
  <AntCheckbox ref={ref} className={cn("peer", className)} checked={checked === "indeterminate" ? false : checked} indeterminate={checked === "indeterminate"} onChange={(event) => { onCheckedChange?.(event.target.checked); onChange?.(event); }} {...props} />
));
Checkbox.displayName = "Checkbox";
