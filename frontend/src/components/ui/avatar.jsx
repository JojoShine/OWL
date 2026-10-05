import * as React from "react"
import { Avatar as AntAvatar } from "antd"
import { cn } from "@/lib/utils"
export function Avatar({ children, className, ...props }) {
 const parts = React.Children.toArray(children);
 const image = parts.find((child) => child.type === AvatarImage);
 const fallback = parts.find((child) => child.type === AvatarFallback);
 return <AntAvatar data-slot="avatar" className={cn("shrink-0", fallback?.props.className, className)} src={image?.props.src} alt={image?.props.alt} {...props}>{fallback?.props.children}</AntAvatar>;
}
export function AvatarImage() { return null; }
export function AvatarFallback() { return null; }
