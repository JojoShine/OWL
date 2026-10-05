import * as React from "react"
import { Progress as AntProgress } from "antd"
export const Progress = React.forwardRef(({ value = 0, max = 100, ...props }, ref) => <AntProgress ref={ref} percent={value / max * 100} showInfo={false} size="small" {...props} />);
Progress.displayName = "Progress";
