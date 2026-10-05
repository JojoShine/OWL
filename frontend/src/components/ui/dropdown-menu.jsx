import * as React from 'react';
import { Dropdown } from 'antd';
import { CheckIcon, CircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import './overlay-compat.css';

function DropdownMenu({ children, open, defaultOpen = false, onOpenChange }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const parts = React.Children.toArray(children);
  const trigger = parts.find((child) => child.type === DropdownMenuTrigger);
  const content = parts.find((child) => child.type === DropdownMenuContent);
  const setOpen = (value) => { if (open === undefined) setInternalOpen(value); onOpenChange?.(value); };
  function items(nodes, prefix = '', radio) {
    return React.Children.toArray(nodes).flatMap((child, index) => {
      if (!React.isValidElement(child)) return [];
      const p = child.props;
      const key = `${prefix}${index}`;
      if (child.type === React.Fragment || child.type === DropdownMenuGroup || child.type === DropdownMenuPortal) return items(p.children, `${key}-`, radio);
      if (child.type === DropdownMenuRadioGroup) return items(p.children, `${key}-`, p);
      if (child.type === DropdownMenuSeparator) return [{ key, type: 'divider' }];
      if (child.type === DropdownMenuSub) {
        const sub = React.Children.toArray(p.children);
        const label = sub.find((item) => item.type === DropdownMenuSubTrigger);
        const body = sub.find((item) => item.type === DropdownMenuSubContent);
        return [{ key, label: label?.props.children, disabled: label?.props.disabled, children: items(body?.props.children, `${key}-`) }];
      }
      const selectable = [DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem].includes(child.type);
      if (!selectable) {
        const containsItems = (nodes) => React.Children.toArray(nodes).some((node) => React.isValidElement(node) && ([DropdownMenuItem, DropdownMenuRadioItem, DropdownMenuCheckboxItem].includes(node.type) || containsItems(node.props.children)));
        if (containsItems(p.children)) return [{ key, type: 'group', className: cn('overflow-y-auto', p.className), children: items(p.children, `${key}-`, radio) }];
        return [{ key, type: 'group', label: child.type === DropdownMenuLabel ? <div className={p.className}>{p.children}</div> : child }];
      }
      const checked = child.type === DropdownMenuCheckboxItem ? p.checked : child.type === DropdownMenuRadioItem && radio?.value === p.value;
      return [{ key, disabled: p.disabled, danger: p.variant === 'destructive', className: p.className,
        label: p.asChild ? React.cloneElement(React.Children.only(p.children), { onClick: (event) => { p.children.props.onClick?.(event); } }) : p.children,
        icon: checked ? (child.type === DropdownMenuRadioItem ? <CircleIcon className="size-2 fill-current" /> : <CheckIcon className="size-4" />) : undefined,
        role: child.type === DropdownMenuCheckboxItem ? 'menuitemcheckbox' : child.type === DropdownMenuRadioItem ? 'menuitemradio' : 'menuitem',
        'aria-checked': child.type === DropdownMenuItem ? undefined : !!checked,
        onClick: ({ domEvent }) => {
          p.onClick?.(domEvent);
          p.onSelect?.(domEvent);
          if (child.type === DropdownMenuCheckboxItem) p.onCheckedChange?.(!p.checked);
          if (child.type === DropdownMenuRadioItem) radio?.onValueChange?.(p.value);
          if (!domEvent.defaultPrevented) setOpen(false);
        } }];
    });
  }
  return <Dropdown autoFocus open={open ?? internalOpen} onOpenChange={(next, info) => { if (info.source !== 'menu') setOpen(next); }} trigger={['click']} placement={content?.props.align === 'end' ? 'bottomRight' : 'bottomLeft'}
    classNames={{ root: cn('owl-dropdown', content?.props.className) }} menu={{ items: items(content?.props.children), selectable: false }} destroyOnHidden>{trigger}</Dropdown>;
}
const DropdownMenuTrigger = React.forwardRef(function DropdownMenuTrigger({ asChild, children, ...props }, ref) {
  return asChild ? React.cloneElement(React.Children.only(children), { ...props, ref, onClick: (event) => { children.props.onClick?.(event); if (!event.defaultPrevented) props.onClick?.(event); } }) : <button type="button" ref={ref} {...props}>{children}</button>;
});
function DropdownMenuPortal({ children }) { return children; }
function DropdownMenuContent({ children }) { return children; }
function DropdownMenuGroup({ children }) { return children; }
function DropdownMenuItem({ children }) { return children; }
function DropdownMenuCheckboxItem({ children }) { return children; }
function DropdownMenuRadioGroup({ children }) { return children; }
function DropdownMenuRadioItem({ children }) { return children; }
function DropdownMenuLabel({ children }) { return children; }
function DropdownMenuSeparator() { return null; }
function DropdownMenuShortcut({ className, ...props }) { return <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />; }
function DropdownMenuSub({ children }) { return children; }
function DropdownMenuSubTrigger({ children }) { return children; }
function DropdownMenuSubContent({ children }) { return children; }
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent };
