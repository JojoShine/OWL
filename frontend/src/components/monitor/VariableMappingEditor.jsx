
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// 可用的数据字段路径（针对API监控）
const AVAILABLE_FIELDS = [
  { value: 'name', label: 'name', description: '监控名称' },
  { value: 'url', label: 'url', description: '接口地址' },
  { value: 'method', label: 'method', description: '请求方法' },
  { value: 'lastLog.status', label: 'lastLog.status', description: '最新状态' },
  { value: 'lastLog.status_code', label: 'lastLog.status_code', description: '状态码' },
  { value: 'lastLog.error_message', label: 'lastLog.error_message', description: '错误信息' },
  { value: 'lastLog.response_time', label: 'lastLog.response_time', description: '响应时间(ms)' },
  { value: '__timestamp__', label: '__timestamp__', description: '当前时间戳' },
  { value: '__date__', label: '__date__', description: '当前日期' },
  { value: '__custom__', label: '自定义', description: '手动输入字段路径' },
];

/**
 * 变量映射编辑器
 * 用于配置模板变量与数据字段的映射关系
 */
export default function VariableMappingEditor({ variableSchema = [], value = {}, onChange }) {
  const [customValues, setCustomValues] = React.useState({});

  const handleFieldChange = (variableName, fieldPath) => {
    const newMapping = {
      ...value,
      [variableName]: fieldPath,
    };
    onChange(newMapping);
  };

  const handleCustomValueChange = (variableName, customPath) => {
    setCustomValues({
      ...customValues,
      [variableName]: customPath,
    });
    handleFieldChange(variableName, customPath);
  };

  if (!variableSchema || variableSchema.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded">
        该模板未定义变量Schema，将使用默认映射
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">变量映射配置</Label>
        <p className="text-xs text-muted-foreground mt-1">
          配置如何从监控数据中提取变量值
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">模板变量</TableHead>
              <TableHead className="w-[120px]">类型</TableHead>
              <TableHead className="w-[80px]">必填</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[250px]">数据字段路径</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variableSchema.map((schema) => (
              <TableRow key={schema.name}>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {`{{${schema.name}}}`}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {schema.type || 'string'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {schema.required ? (
                    <Badge variant="destructive" className="text-xs">必填</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">可选</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {schema.description || schema.label || '-'}
                </TableCell>
                <TableCell>
                  {value[schema.name] && !AVAILABLE_FIELDS.find(f => f.value === value[schema.name]) && value[schema.name] !== '__custom__' ? (
                    // 显示自定义输入框
                    <Input
                      value={value[schema.name] || ''}
                      onChange={(e) => handleCustomValueChange(schema.name, e.target.value)}
                      placeholder="例如: data.field"
                      className="h-8 text-xs font-mono"
                    />
                  ) : (
                    <Select
                      value={value[schema.name] || ''}
                      onValueChange={(val) => {
                        if (val === '__custom__') {
                          handleCustomValueChange(schema.name, '');
                        } else {
                          handleFieldChange(schema.name, val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="选择字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value} className="text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <code className="font-mono">{field.label}</code>
                              <span className="text-muted-foreground">{field.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
        <p className="font-medium">说明：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>选择数据字段路径，或选择“自定义”手动输入路径</li>
          <li>支持嵌套路径，如 <code className="bg-background px-1">lastLog.status</code></li>
          <li>特殊值 <code className="bg-background px-1">__timestamp__</code> 会在运行时自动生成当前时间</li>
        </ul>
      </div>
    </div>
  );
}
