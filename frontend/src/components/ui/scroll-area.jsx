import * as React from "react"
import { Flex } from "antd"
import { cn } from "@/lib/utils"
export const ScrollArea = React.forwardRef(({ className, style, ...props }, ref) => <Flex ref={ref} vertical className={cn("relative", className)} style={{ overflow: "auto", scrollbarWidth: "thin", ...style }} {...props} />);
// Native scrollbars are rendered by the scroll container and follow its overflow.
export const ScrollBar = () => null;
ScrollArea.displayName = "ScrollArea";
