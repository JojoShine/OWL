'use client';

import React, { useState } from 'react';
import { Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const notificationTypes = [
  { value: 'info', label: '信息', color: 'text-blue-500' },
  { value: 'system', label: '系统', color: 'text-gray-500' },
  { value: 'warning', label: '警告', color: 'text-yellow-500' },
  { value: 'error', label: '错误', color: 'text-red-500' },
  { value: 'success', label: '成功', color: 'text-green-500' },
];

export default function BroadcastNotificationDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'system',
    link: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'system',
      link: '',
    });
    setErrors({});
  };

  // 表单验证
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (formData.title.length > 255) {
      newErrors.title = '标题不能超过255个字符';
    }

    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择通知类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(formData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理对话框关闭
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            广播通知
          </DialogTitle>
          <DialogDescription>
            向所有活跃用户发送系统通知
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Radio className="h-4 w-4" />
          <AlertDescription>
            此通知将发送给所有活跃用户，请谨慎使用
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* 通知类型 */}
          <div className="space-y-2">
            <Label htmlFor="type">
              通知类型 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
            >
              <SelectTrigger id="type" className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="选择通知类型" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className={type.color}>{type.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>

          {/* 通知标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              通知标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="请输入通知标题"
              maxLength={255}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/255
            </p>
          </div>

          {/* 通知内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              通知内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="请输入通知内容"
              rows={4}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* 跳转链接（可选） */}
          <div className="space-y-2">
            <Label htmlFor="link">跳转链接（可选）</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              placeholder="例如：/dashboard"
            />
            <p className="text-xs text-muted-foreground">
              用户点击通知后跳转的页面路径
            </p>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                发送中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                广播通知
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
