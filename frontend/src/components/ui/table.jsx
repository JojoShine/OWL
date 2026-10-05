
import * as React from "react"
import { Table as AntTable } from "antd"
import "./antd-controls.css"

import { cn } from "@/lib/utils"

const TableContext = React.createContext({});
function CompatibilityHeader() {
  return React.useContext(TableContext).header;
}
function CompatibilityBody({ children }) {
  const { body } = React.useContext(TableContext);
  return <TableBody {...body?.props}>{children}</TableBody>;
}
function CompatibilityRow({ originalRow }) {
  return originalRow;
}
function CompatibilityTable({ children, ...props }) {
  const { caption, footer, className, tableProps } = React.useContext(TableContext);
  return <table {...props} {...tableProps} data-slot="table" className={cn("w-full caption-bottom text-sm", className)}>{caption}{children}{footer}</table>;
}
const compoundComponents = { table: CompatibilityTable, header: { wrapper: CompatibilityHeader }, body: { row: CompatibilityRow, wrapper: CompatibilityBody } };

function Table({ className, children, ...props }) {
  if (!children) return <AntTable className={cn("owl-table", className)} {...props} />;
  const parts = React.Children.toArray(children);
  const header = parts.find((child) => child.type === TableHeader);
  const body = parts.find((child) => child.type === TableBody);
  const footer = parts.find((child) => child.type === TableFooter);
  const caption = parts.find((child) => child.type === TableCaption);
  const rows = React.Children.toArray(body?.props.children).map((row, index) => ({ key: row.key ?? index, row }));
  return <TableContext.Provider value={{ header, body, footer, caption, className, tableProps: props }}>
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <AntTable className="owl-table" size="small" pagination={false} showHeader={Boolean(header)}
        components={compoundComponents}
        columns={[{ key: "content", render: () => null }]} dataSource={rows}
        onRow={(record) => ({ originalRow: record.row })} locale={{ emptyText: null }} />
    </div>
  </TableContext.Provider>;
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props} />
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props} />
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props} />
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
