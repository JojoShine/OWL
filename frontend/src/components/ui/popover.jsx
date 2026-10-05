import * as React from 'react';
import { Popover as AntPopover } from 'antd';
import { cn } from '@/lib/utils';
import './overlay-compat.css';
function Popover({ children, open, defaultOpen = false, onOpenChange }) {
  const parts = React.Children.toArray(children);
  const trigger = parts.find((child) => child.type === PopoverTrigger);
  const content = parts.find((child) => child.type === PopoverContent);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const setOpen = (value) => { if (open === undefined) setInternalOpen(value); onOpenChange?.(value); };
  const side = content?.props.side || 'bottom';
  const align = content?.props.align || 'center';
  const placement = side + (align === 'center' ? '' : (side === 'top' || side === 'bottom' ? (align === 'start' ? 'Left' : 'Right') : (align === 'start' ? 'Top' : 'Bottom')));
  return <AntPopover trigger="click" open={open ?? internalOpen} onOpenChange={setOpen} placement={placement} arrow={false} classNames={{ root: 'owl-popover' }} content={<div onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }}>{content}</div>} destroyOnHidden>{trigger}</AntPopover>;
}
const PopoverTrigger = React.forwardRef(function PopoverTrigger({ asChild, children, ...props }, ref) {
  return asChild ? React.cloneElement(React.Children.only(children), { ...props, ref, onClick: (event) => { children.props.onClick?.(event); if (!event.defaultPrevented) props.onClick?.(event); } }) : <button type="button" ref={ref} {...props}>{children}</button>;
});
const PopoverContent = React.forwardRef(function PopoverContent({ className, align, side, sideOffset, ...props }, ref) {
  return <div ref={ref} className={cn('w-72 p-4 text-popover-foreground', className)} {...props} />;
});
export { Popover, PopoverTrigger, PopoverContent };
