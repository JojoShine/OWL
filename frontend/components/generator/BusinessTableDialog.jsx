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
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-6xl">
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

            <div className="overflow-x-auto rounded-lg border">
              <div className="min-w-[1060px]">
                <div className="grid grid-cols-[145px_150px_105px_140px_180px_48px_48px_48px_104px] items-center gap-2 bg-muted/45 px-3 py-2.5 text-xs font-medium text-muted-foreground">
                  <span>字段名 *</span>
                  <span>字段说明</span>
                  <span>类型 *</span>
                  <span>类型参数</span>
                  <span>默认值</span>
                  <span className="text-center">必填</span>
                  <span className="text-center">唯一</span>
                  <span className="text-center">索引</span>
                  <span className="text-right">操作</span>
                </div>
                {fields.map((field, index) => (
                  <div key={field.key} className="grid grid-cols-[145px_150px_105px_140px_180px_48px_48px_48px_104px] items-center gap-2 border-t px-3 py-2 transition-colors hover:bg-muted/20">
                    <Input className="h-9" value={field.name} onChange={(event) => updateField(field.key, { name: event.target.value.toLowerCase() })} placeholder="customer_name" aria-label="字段名" />
                    <Input className="h-9" value={field.comment} onChange={(event) => updateField(field.key, { comment: event.target.value })} placeholder="客户名称" aria-label="字段说明" />
                    <Select value={field.type} onValueChange={(type) => updateField(field.key, { type, default_value: '', default_current_time: false })}>
                      <SelectTrigger className="h-9 w-full" aria-label="字段类型"><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex h-9 items-center gap-2">
                      {field.type === 'string' ? (
                        <Input className="h-9" type="number" min="1" max="2000" value={field.length} onChange={(event) => updateField(field.key, { length: event.target.value })} placeholder="最大长度" aria-label="最大长度" />
                      ) : field.type === 'decimal' ? (
                        <>
                          <Input className="h-9 min-w-0" type="number" min="1" max="38" value={field.precision} onChange={(event) => updateField(field.key, { precision: event.target.value })} placeholder="精度" aria-label="精度" />
                          <Input className="h-9 min-w-0" type="number" min="0" max="38" value={field.scale} onChange={(event) => updateField(field.key, { scale: event.target.value })} placeholder="小数位" aria-label="小数位" />
                        </>
                      ) : (
                        <span className="px-3 text-sm text-muted-foreground/60">—</span>
                      )}
                    </div>
                    <div className="flex h-9 items-center gap-2">
                      {field.type === 'boolean' ? (
                        <Select value={field.default_value || 'none'} onValueChange={(value) => updateField(field.key, { default_value: value === 'none' ? '' : value })}>
                          <SelectTrigger className="h-9 w-full" aria-label="默认值"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">无默认值</SelectItem><SelectItem value="true">是</SelectItem><SelectItem value="false">否</SelectItem></SelectContent>
                        </Select>
                      ) : field.type === 'datetime' ? (
                        <>
                          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                            <Checkbox checked={field.default_current_time} onCheckedChange={(checked) => updateField(field.key, { default_current_time: checked, default_value: checked ? '' : field.default_value })} />当前时间
                          </label>
                          {!field.default_current_time ? <Input className="h-9 min-w-0" value={field.default_value} onChange={(event) => updateField(field.key, { default_value: event.target.value })} placeholder="可选" aria-label="默认值" /> : null}
                        </>
                      ) : (
                        <Input className="h-9" value={field.default_value} onChange={(event) => updateField(field.key, { default_value: event.target.value })} placeholder={field.type === 'json' ? '{}' : '可选'} aria-label="默认值" />
                      )}
                    </div>
                    <div className="flex justify-center"><Checkbox checked={!field.nullable} onCheckedChange={(checked) => updateField(field.key, { nullable: !checked })} aria-label="必填" /></div>
                    <div className="flex justify-center"><Checkbox checked={field.unique} onCheckedChange={(checked) => updateField(field.key, { unique: checked, indexed: checked ? false : field.indexed })} aria-label="唯一" /></div>
                    <div className="flex justify-center"><Checkbox checked={field.indexed} disabled={field.unique} onCheckedChange={(checked) => updateField(field.key, { indexed: checked })} aria-label="索引" /></div>
                    <div className="flex items-center justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="上移字段"><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} aria-label="下移字段"><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFields((current) => current.filter((item) => item.key !== field.key))} disabled={fields.length === 1} aria-label="删除字段"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
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
