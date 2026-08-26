"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props} />
  );
}

function TabsList({
  className,
  stretch = false,
  wrap = false,
  ...props
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex min-h-10 max-w-full items-center gap-1 rounded-lg border border-border bg-muted p-1 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:bg-muted/45 dark:shadow-none",
        wrap ? "flex-wrap justify-start" : "h-10",
        stretch
          ? "w-full [&>[data-slot=tabs-trigger]]:min-w-0 [&>[data-slot=tabs-trigger]]:flex-1 [&>[data-slot=tabs-trigger]]:px-2"
          : "w-fit",
        className
      )}
      {...props} />
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 min-w-0 flex-none items-center justify-center gap-1.5 overflow-hidden rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap text-ellipsis text-muted-foreground transition-[background-color,color,box-shadow] duration-150 hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-inset data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_1px_3px_rgba(15,23,42,0.22)] data-[state=active]:hover:bg-foreground data-[state=active]:hover:text-background dark:data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.45)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props} />
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
