import * as React from "react"
import { Slider as AntSlider } from "antd"
export const Slider = React.forwardRef(({ value, defaultValue, onValueChange, onValueCommit, orientation, ...props }, ref) => {
  const range = (value ?? defaultValue ?? []).length > 1;
  return <AntSlider ref={ref} range={range} vertical={orientation === "vertical"} value={range ? value : value?.[0]} defaultValue={range ? defaultValue : defaultValue?.[0]} onChange={(next) => onValueChange?.(Array.isArray(next) ? next : [next])} onChangeComplete={(next) => onValueCommit?.(Array.isArray(next) ? next : [next])} {...props} />;
});
Slider.displayName = "Slider";
