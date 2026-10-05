import * as React from "react"
import { Select as AntSelect } from "antd"
import { cn } from "@/lib/utils"
import "./antd-controls.css"

// Keep the existing compound API while handing focus, keyboard navigation,
// filtering and popup placement to Ant Design.
function walk(children, visit) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    visit(child);
    walk(child.props.children, visit);
  });
}
function Select({ children, onValueChange, onOpenChange, value, defaultValue, ...props }) {
  let trigger = {};
  let placeholder;
  let popupClassName;
  const options = [];
  walk(children, (child) => {
    if (child.type === SelectTrigger) trigger = child.props;
    if (child.type === SelectValue) placeholder = child.props.placeholder;
    if (child.type === SelectContent) popupClassName = child.props.className;
    if (child.type === SelectItem) options.push({ value: child.props.value, label: child.props.children, disabled: child.props.disabled, title: child.props.textValue });
  });
  const { children: triggerChildren, className, size, ...triggerProps } = trigger;
  return <AntSelect
    virtual={false}
    {...props}
    {...triggerProps}
    data-slot="select-trigger"
    className={cn("owl-select", className)}
    classNames={{ popup: { root: popupClassName } }}
    size={size === "sm" ? "small" : "middle"}
    value={value === "" ? undefined : value}
    defaultValue={defaultValue === "" ? undefined : defaultValue}
    placeholder={placeholder}
    options={options}
    onChange={(next) => onValueChange?.(next)}
    onOpenChange={onOpenChange}
  />;
}
function SelectTrigger() { return null; }
function SelectValue() { return null; }
function SelectContent() { return null; }
function SelectItem() { return null; }
function SelectGroup() { return null; }
function SelectLabel() { return null; }
function SelectSeparator() { return null; }
function SelectScrollUpButton() { return null; }
function SelectScrollDownButton() { return null; }
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton };
