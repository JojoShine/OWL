import * as React from "react"
import { Radio } from "antd"
import { cn } from "@/lib/utils"
export const RadioGroup = React.forwardRef(({ className, onValueChange, onChange, ...props }, ref) => <Radio.Group ref={ref} className={cn("grid gap-2", className)} onChange={(event) => { onValueChange?.(event.target.value); onChange?.(event); }} {...props} />);
export const RadioGroupItem = React.forwardRef((props, ref) => <Radio ref={ref} {...props} />);
RadioGroup.displayName = "RadioGroup";
RadioGroupItem.displayName = "RadioGroupItem";
