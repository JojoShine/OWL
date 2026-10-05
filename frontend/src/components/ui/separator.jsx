import * as React from "react"
import { Divider } from "antd"
export function Separator({ orientation = "horizontal", decorative = true, ...props }) {
 return <Divider data-slot="separator" type={orientation} role={decorative ? "presentation" : "separator"} style={{ margin: 0 }} {...props} />;
}
