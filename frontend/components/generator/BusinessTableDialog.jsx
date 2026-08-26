'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generatorApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const TYPE_OPTIONS = [
  ['string', '文本'],
  ['text', '长文本'],
  ['integer', '整数'],
  ['bigint', '长整数'],
  ['decimal', '小数'],
  ['boolean', '布尔值'],
  ['date', '日期'],
  ['datetime', '日期时间'],
  ['json', 'JSON'],
];
const RESERVED_FIELDS = new Set(['id', 'created_by', 'updated_by', 'deleted_by', 'created_at', 'updated_at', 'deleted_at']);

let fieldSequence = 0;
function createEmptyField() {
  fieldSequence += 1;
  return {
    key: `field-${fieldSequence}`,
    name: '',
    comment: '',
    type: 'string',
    length: 255,
    precision: 10,
    scale: 2,
    nullable: true,
    unique: false,
    indexed: false,
    default_value: '',
    default_current_time: false,
  };
}

function validateForm(tableName, fields) {
  if (!/^[a-z][a-z0-9_]{0,58}$/.test(tableName)) {
    return '表名只能使用小写字母、数字和下划线，并以字母开头';
  }
  if (tableName.startsWith('biz_') || tableName.startsWith('owl_')) return '表名只需填写 biz_ 后面的名称';
  if (!fields.length) return '请至少添加一个业务字段';

  const names = new Set();
  for (const field of fields) {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(field.name)) return '字段名只能使用小写字母、数字和下划线，并以字母开头';
    if (RESERVED_FIELDS.has(field.name)) return `字段 ${field.name} 是系统保留字段`;
    if (names.has(field.name)) return `字段 ${field.name} 重复`;
    names.add(field.name);
    if (field.type === 'string' && (!Number.isInteger(Number(field.length)) || Number(field.length) < 1 || Number(field.length) > 2000)) return `字段 ${field.name} 的长度必须在 1 到 2000 之间`;
    if (field.type === 'decimal' && Number(field.scale) > Number(field.precision)) return `字段 ${field.name} 的小数位不能大于精度`;
  }
  return null;
}

function toPayloadField(field) {
  let defaultValue = field.default_value;
  if (field.type === 'boolean' && defaultValue !== '') defaultValue = defaultValue === 'true';
  return {
    name: field.name.trim(),
    comment: field.comment.trim(),
    type: field.type,
    nullable: field.nullable,
    unique: field.unique,
    indexed: field.unique ? false : field.indexed,
    ...(field.type === 'string' ? { length: Number(field.length) } : {}),
    ...(field.type === 'decimal' ? { precision: Number(field.precision), scale: Number(field.scale) } : {}),
    ...(defaultValue !== '' ? { default_value: defaultValue } : {}),
    ...(field.type === 'datetime' ? { default_current_time: field.default_current_time } : {}),
  };
}

export default function BusinessTableDialog({ open, onOpenChange, onCreated }) {
  const [tableName, setTableName] = useState('');
  const [tableComment, setTableComment] = useState('');
  const [fields, setFields] = useState([createEmptyField()]);
  const [submitting, setSubmitting] = useState(false);
  const validationMessage = useMemo(() => validateForm(tableName, fields), [tableName, fields]);

  useEffect(() => {
    if (!open) return;
    setTableName('');
    setTableComment('');
    setFields([createEmptyField()]);
    setSubmitting(false);
  }, [open]);

  const updateField = (key, changes) => {
    setFields((current) => current.map((field) => field.key === key ? { ...field, ...changes } : field));
  };

  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = async () => {
    if (validationMessage) return toast.error(validationMessage);
    setSubmitting(true);
    try {
      const response = await generatorApi.createBusinessTable({
        table_name: tableName.trim(),
        table_comment: tableComment.trim(),
        fields: fields.map(toPayloadField),
      });
      const result = response.data;
      toast.success(`业务表 ${result.tableName} 创建成功`);
      onOpenChange(false);
      onCreated?.(result.moduleConfig, result.tableName);
    } catch (error) {
      toast.error(error.response?.data?.message || '业务表创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>新建业务表</DialogTitle>
          <DialogDescription>创建后将自动初始化代码生成配置，不支持在此修改或删除已有表。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-table-name">表名 *</Label>
              <div className="flex h-10 overflow-hidden rounded-md border border-input focus-within:border-primary">
                <span className="flex items-center border-r bg-muted/60 px-3 font-mono text-sm text-muted-foreground">biz_</span>
                <Input id="business-table-name" value={tableName} onChange={(event) => setTableName(event.target.value.toLowerCase())} className="h-full rounded-none border-0 shadow-none focus-visible:ring-0" placeholder="customer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-table-comment">表说明</Label>
              <Input id="business-table-comment" value={tableComment} onChange={(event) => setTableComment(event.target.value)} placeholder="例如：客户资料" />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
            系统将自动添加主键与审计字段：id、created_by、updated_by、deleted_by、created_at、updated_at、deleted_at。
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-medium">业务字段</h3><p className="text-xs text-muted-foreground">按当前顺序生成字段和默认维护配置。</p></div>
              <Button type="button" variant="outline" size="sm" onClick={() => setFields((current) => [...current, createEmptyField()])}><Plus className="h-4 w-4" />添加字段</Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.key} className="rounded-lg border p-4">
                  <div className="grid gap-3 lg:grid-cols-[1.1fr_1.1fr_0.8fr_auto]">
                    <div className="space-y-1.5"><Label>字段名 *</Label><Input value={field.name} onChange={(event) => updateField(field.key, { name: event.target.value.toLowerCase() })} placeholder="customer_name" /></div>
                    <div className="space-y-1.5"><Label>字段说明</Label><Input value={field.comment} onChange={(event) => updateField(field.key, { comment: event.target.value })} placeholder="客户名称" /></div>
                    <div className="space-y-1.5">
                      <Label>类型 *</Label>
                      <Select value={field.type} onValueChange={(type) => updateField(field.key, { type, default_value: '', default_current_time: false })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{TYPE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="上移字段"><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} aria-label="下移字段"><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFields((current) => current.filter((item) => item.key !== field.key))} disabled={fields.length === 1} aria-label="删除字段"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {field.type === 'string' ? <div className="space-y-1.5"><Label>最大长度</Label><Input type="number" min="1" max="2000" value={field.length} onChange={(event) => updateField(field.key, { length: event.target.value })} /></div> : null}
                    {field.type === 'decimal' ? <><div className="space-y-1.5"><Label>精度</Label><Input type="number" min="1" max="38" value={field.precision} onChange={(event) => updateField(field.key, { precision: event.target.value })} /></div><div className="space-y-1.5"><Label>小数位</Label><Input type="number" min="0" max="38" value={field.scale} onChange={(event) => updateField(field.key, { scale: event.target.value })} /></div></> : null}
                    {field.type !== 'datetime' || !field.default_current_time ? (
                      <div className="space-y-1.5">
                        <Label>默认值</Label>
                        {field.type === 'boolean' ? (
                          <Select value={field.default_value || 'none'} onValueChange={(value) => updateField(field.key, { default_value: value === 'none' ? '' : value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">无默认值</SelectItem><SelectItem value="true">是</SelectItem><SelectItem value="false">否</SelectItem></SelectContent></Select>
                        ) : field.type === 'json' ? (
                          <Textarea className="min-h-10" value={field.default_value} onChange={(event) => updateField(field.key, { default_value: event.target.value })} placeholder="{}" />
                        ) : (
                          <Input value={field.default_value} onChange={(event) => updateField(field.key, { default_value: event.target.value })} placeholder="可选" />
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={!field.nullable} onCheckedChange={(checked) => updateField(field.key, { nullable: !checked })} />必填</label>
                    <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={field.unique} onCheckedChange={(checked) => updateField(field.key, { unique: checked, indexed: checked ? false : field.indexed })} />唯一</label>
                    <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={field.indexed} disabled={field.unique} onCheckedChange={(checked) => updateField(field.key, { indexed: checked })} />索引</label>
                    {field.type === 'datetime' ? <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={field.default_current_time} onCheckedChange={(checked) => updateField(field.key, { default_current_time: checked, default_value: checked ? '' : field.default_value })} />默认当前时间</label> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" onClick={submit} disabled={submitting || !!validationMessage}>{submitting ? '创建中...' : '创建业务表'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { validateForm, toPayloadField };
