import * as React from "react"
import { Alert as AntAlert } from "antd";
import "./overlay-compat.css";
import { Info, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "owl-notice relative w-full rounded-xl border px-4 py-3 text-sm leading-6",
  {
    variants: {
      variant: {
        default: "border-border/60 bg-muted/40 text-foreground",
        info: "border-blue-500/10 bg-blue-500/[0.05] text-blue-900 dark:text-blue-200",
        warning: "border-amber-500/10 bg-amber-500/[0.06] text-amber-900 dark:text-amber-200",
        success: "border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-900 dark:text-emerald-200",
        destructive:
          "border-destructive/15 bg-destructive/[0.05] text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => {
  const content = React.Children.toArray(children);
  const hasIcon = content.some((child) => React.isValidElement(child) && child.type !== AlertTitle && child.type !== AlertDescription);
  const Icon = { destructive: CircleAlert, warning: TriangleAlert, success: CircleCheck }[variant] || Info;
  return (
    <AntAlert ref={ref} role="alert" data-variant={variant} type={variant === 'destructive' ? 'error' : variant === 'default' ? 'info' : variant}
      showIcon={!hasIcon} icon={<Icon aria-hidden="true" />} className={cn(alertVariants({ variant }), className)}
      description={<div>{children}</div>} {...props} />
  );
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-6", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-6 [&_p]:leading-6", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
