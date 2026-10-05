import * as React from 'react';
import { Tabs as AntTabs } from 'antd';
import { cn } from '@/lib/utils';
import './overlay-compat.css';
const TabsContext = React.createContext(null);
function Tabs({ value, defaultValue, onValueChange, className, children, orientation = 'horizontal', ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const id = React.useId();
  const setValue = (next) => { if (value === undefined) setInternalValue(next); onValueChange?.(next); };
  return <TabsContext.Provider value={{ value: value ?? internalValue, setValue, id, orientation }}><div data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props}>{children}</div></TabsContext.Provider>;
}
function TabsList({ children, className, stretch = false, wrap = false, ...props }) {
  const { value, setValue, id, orientation } = React.useContext(TabsContext);
  const rootRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const holder = rootRef.current?.nativeElement?.querySelector('.ant-tabs-body-holder');
    if (holder) holder.hidden = true;
    rootRef.current?.nativeElement?.querySelectorAll('.ant-tabs-body-holder [role="tabpanel"]').forEach((panel) => {
      panel.removeAttribute('id');
      panel.setAttribute('aria-hidden', 'true');
    });
  }, [value]);
  const triggers = React.Children.toArray(children).filter(React.isValidElement);
  const items = triggers.map((child) => ({ key: child.props.value, forceRender: true, disabled: child.props.disabled, label: <span data-slot="tabs-trigger" data-state={value === child.props.value ? 'active' : 'inactive'} className={cn('inline-flex items-center gap-1.5 [&_svg]:size-4', child.props.className)} onClick={child.props.onClick}>{child.props.children}</span> }));
  return <AntTabs ref={rootRef} id={id} data-slot="tabs-list" activeKey={value} onChange={setValue} items={items} tabPlacement={orientation === 'vertical' ? 'start' : 'top'} className={cn('owl-tabs', stretch && 'owl-tabs-stretch', wrap && 'owl-tabs-wrap', className)} {...props} />;
}
function TabsTrigger() { return null; }
function TabsContent({ value, forceMount, className, ...props }) {
  const context = React.useContext(TabsContext);
  if (context.value !== value && !forceMount) return null;
  return <div role="tabpanel" id={`${context.id}-panel-${value}`} aria-labelledby={`${context.id}-tab-${value}`} hidden={context.value !== value} tabIndex={0} data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />;
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
