'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { emailTemplateApi } from '@/lib/api';
import { toast } from 'sonner';

const frequencyOptions = [
  { value: 'once', label: '一次' },
  { value: 'hourly', label: '每小时' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
];

export default function EmailTaskDialog({ open, onOpenChange, task, onSave }) {
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    recipients: '',
    frequency: 'daily',
    enabled: true,
    template_variables: {},
  });

  // 获取邮件模板列表
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await emailTemplateApi.getTemplates({ limit: 100 });
      if (response.success) {
        setTemplates(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('获取邮件模板列表失败');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // 初始化表单
  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (task) {
        setFormData({
          name: task.name || '',
          description: task.description || '',
          template_id: task.template_id || '',
          recipients: task.recipients || '',
          frequency: task.frequency || 'daily',
          enabled: task.enabled !== false,
          template_variables: task.template_variables || {},
        });
      } else {
        setFormData({
          name: '',
          description: '',
          template_id: '',
          recipients: '',
          frequency: 'daily',
          enabled: true,
          template_variables: {},
        });
      }
    }
  }, [open, task, fetchTemplates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name.trim()) {
      toast.error('请填写任务名称');
      return;
    }

    if (!formData.template_id) {
      toast.error('请选择邮件模板');
      return;
    }

    // 验证收件人邮箱格式
    const recipients = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    if (recipients.length === 0) {
      toast.error('请填写收件人邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        toast.error(`邮箱格式不正确: ${email}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? '编辑邮件任务' : '新建邮件任务'}</DialogTitle>
          <DialogDescription>
            {task ? '修改邮件发送任务的配置' : '创建一个新的定时邮件发送任务'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 任务名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              任务名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="例如：每日报告邮件"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* 任务描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">任务描述</Label>
            <Input
              id="description"
              name="description"
              placeholder="输入任务的描述信息（可选）"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* 邮件模板 */}
          <div className="space-y-2">
            <Label htmlFor="template">
              邮件模板 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => handleSelectChange('template_id', value)}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="选择邮件模板" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTemplates ? (
                  <Loading size="sm" text="正在加载模板..." className="px-3 py-2" />
                ) : templates.length === 0 ? (
                  <EmptyState title="暂无可用模板" compact className="px-3" />
                ) : (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 收件人邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="recipients">
              收件人邮箱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipients"
              name="recipients"
              placeholder="多个邮箱用逗号分隔，例如：user1@example.com, user2@example.com"
              value={formData.recipients}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              支持多个收件人，使用逗号分隔
            </p>
          </div>

          {/* 发送频率 */}
          <div className="space-y-2">
            <Label htmlFor="frequency">
              发送频率 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => handleSelectChange('frequency', value)}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 按钮组 */}
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
