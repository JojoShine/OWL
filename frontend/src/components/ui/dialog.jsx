import * as React from 'react';
import { Modal } from 'antd';
import { cn } from '@/lib/utils';
import './overlay-compat.css';

const DialogContext = React.createContext(null);
function Dialog({ open, defaultOpen = false, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const setOpen = (next) => { if (open === undefined) setInternalOpen(next); onOpenChange?.(next); };
  return <DialogContext.Provider value={{ open: open ?? internalOpen, setOpen, titleId, descriptionId }}>{children}</DialogContext.Provider>;
}
function DialogTrigger({ asChild, children, onClick, ...props }) {
  const { setOpen } = React.useContext(DialogContext);
  const click = (event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(true); };
  if (asChild) return React.cloneElement(React.Children.only(children), { ...props, onClick: (event) => { children.props.onClick?.(event); click(event); } });
  return <button type="button" {...props} onClick={click}>{children}</button>;
}
function DialogClose({ asChild, children, onClick, ...props }) {
  const { setOpen } = React.useContext(DialogContext);
  const click = (event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(false); };
  if (asChild) return React.cloneElement(React.Children.only(children), { ...props, onClick: (event) => { children.props.onClick?.(event); click(event); } });
  return <button type="button" {...props} onClick={click}>{children}</button>;
}
function DialogPortal({ children }) { return children; }
function DialogOverlay() { return null; }
function DialogContent({ role = 'dialog', className, children, showCloseButton = true, overlayClassName, onEscapeKeyDown, onPointerDownOutside, onInteractOutside, onOpenAutoFocus, onCloseAutoFocus, preventOutsideClose = false, ...props }) {
  const { open, setOpen, titleId, descriptionId } = React.useContext(DialogContext);
  // Modal width is inline in Ant Design; translate existing size utilities at this boundary.
  const size = [...(className || '').matchAll(/(?:^|\s)(?:sm:)?max-w-(\[[^\]]+\]|[\w-]+)/g)].at(-1)?.[1] || 'lg';
  const widths = { sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', '2xl': '42rem', '3xl': '48rem', '4xl': '56rem', '5xl': '64rem', '6xl': '72rem', '7xl': '80rem', full: '100%' };
  const width = size.startsWith('[') ? size.slice(1, -1) : widths[size] || '32rem';
  const cancel = (event) => {
    if (event?.key === 'Escape' || event?.keyCode === 27) onEscapeKeyDown?.(event);
    else if (!event?.target?.closest?.('.ant-modal-close')) {
      onPointerDownOutside?.(event); onInteractOutside?.(event);
      if (preventOutsideClose) return;
    }
    if (!event?.defaultPrevented) setOpen(false);
  };
  return <Modal open={open} onCancel={cancel} footer={null} title={null} closable={showCloseButton} centered width="calc(100vw - 2rem)" destroyOnHidden
    className="owl-dialog" style={{ maxWidth: `min(calc(100vw - 2rem), ${width})` }}
    classNames={{ mask: cn('owl-dialog-mask bg-black/35 backdrop-blur-[1px]', overlayClassName), container: 'owl-dialog-container' }}
    afterOpenChange={(visible) => { const event = new Event('autofocus', { cancelable: true }); (visible ? onOpenAutoFocus : onCloseAutoFocus)?.(event); }}
    >
    <div ref={(node) => { const dialog = node?.closest('.ant-modal'); if (dialog) { dialog.setAttribute('role', role); dialog.setAttribute('aria-labelledby', titleId); if (node.querySelector(`[id="${descriptionId}"]`)) dialog.setAttribute('aria-describedby', descriptionId); } }} data-slot="dialog-content" className={cn('grid gap-4 p-6', className)} {...props}>{children}</div>
  </Modal>;
}
function DialogHeader({ className, ...props }) { return <div data-slot="dialog-header" className={cn('flex shrink-0 flex-col gap-2 text-center sm:text-left', className)} {...props} />; }
function DialogFooter({ className, ...props }) { return <div data-slot="dialog-footer" className={cn('flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />; }
function DialogTitle({ className, ...props }) { const { titleId } = React.useContext(DialogContext); return <h2 id={titleId} data-slot="dialog-title" className={cn('text-lg leading-none font-semibold', className)} {...props} />; }
function DialogDescription({ className, ...props }) { const { descriptionId } = React.useContext(DialogContext); return <p id={descriptionId} data-slot="dialog-description" className={cn('text-muted-foreground text-sm', className)} {...props} />; }
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
