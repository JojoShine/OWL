'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

const VARIABLE_TYPES = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'date', label: '日期' },
  { value: 'json', label: 'JSON' },
];

/**
 * 变量Schema编辑器
 * 用于定义模板需要哪些变量
 */
export default function VariableSchemaEditor({ value = [], onChange }) {
  const handleAdd = () => {
    const newVariable = {
      name: '',
      label: '',
      description: '',
      type: 'string',
      required: false,
      defaultValue: '',
      example: '',
    };
    onChange([...value, newVariable]);
  };

  const handleRemove = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleChange = (index, field, fieldValue) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      [field]: fieldValue,
    };
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>变量定义 (Variable Schema)</Label>
        <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          添加变量
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed">
          <EmptyState title="暂无变量定义" description="点击上方“添加变量”按钮开始定义" />
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((variable, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* 第一行：变量名、类型、必填、删除按钮 */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-4">
                      <Label className="text-xs">
                        变量名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={variable.name}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        placeholder="例如: userName"
                        className="mt-1.5 h-10 font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">类型</Label>
                      <Select
                        value={variable.type}
                        onValueChange={(val) => handleChange(index, 'type', val)}
                      >
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">必填</Label>
                      <div className="mt-1.5 flex h-10 items-center">
                        <Checkbox
                          checked={variable.required}
                          onCheckedChange={(checked) =>
                            handleChange(index, 'required', checked)
                          }
                        />
                      </div>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(index)}
                        className="mt-5"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>

                  {/* 第二行：显示名、默认值 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">显示名</Label>
                      <Input
                        value={variable.label}
                        onChange={(e) => handleChange(index, 'label', e.target.value)}
                        placeholder="例如: 用户名"
                        className="mt-1.5 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">默认值</Label>
                      <Input
                        value={variable.defaultValue}
                        onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                        placeholder="可选"
                        className="mt-1.5 h-10"
                      />
                    </div>
                  </div>

                  {/* 第三行：描述 */}
                  <div>
                    <Label className="text-xs">描述</Label>
                    <Input
                      value={variable.description}
                      onChange={(e) => handleChange(index, 'description', e.target.value)}
                      placeholder="变量的用途说明"
                      className="mt-1.5 h-10"
                    />
                  </div>

                  {/* 第四行：示例 */}
                  <div>
                    <Label className="text-xs">示例值</Label>
                    <Input
                      value={variable.example}
                      onChange={(e) => handleChange(index, 'example', e.target.value)}
                      placeholder="例如: 张三"
                      className="mt-1.5 h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        变量Schema定义了模板需要哪些变量。使用方可以通过变量映射来配置如何从数据中提取这些变量。
      </p>
    </div>
  );
}
