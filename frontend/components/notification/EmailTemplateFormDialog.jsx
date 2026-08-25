'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/rich-text-editor';

/**
 * 获取默认邮件模板内容（通用模板）
 */
function getDefaultTemplateContent() {
  return '';
}

/**
 * 邮件模版表单对话框
 * 新设计：使用预定义变量，不需要用户手动添加变量
 */
export default function EmailTemplateFormDialog({ open, onOpenChange, template, onSave, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    description: '',
  });

  // 当模版数据变化时更新表单
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        content: template.content || '',
        description: template.description || '',
      });
    } else {
      // 重置表单，使用优化的默认模板
      setFormData({
        name: '',
        subject: '',
        content: getDefaultTemplateContent(),
        description: '',
      });
    }
  }, [template]);

  /**
   * 提交表单
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? '编辑邮件模版' : '创建邮件模版'}
          </DialogTitle>
          <DialogDescription>
            创建一个邮件模板，使用富文本编辑器编辑邮件内容
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 pr-2">
              {/* 表单字段 */}
              <div className="space-y-4">
                {/* 模版名称 */}
                <div className="space-y-2">
                  <Label htmlFor="template-name">
                    模版名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：接口监控告警模版"
                    required
                    disabled={!!template} // 编辑时不允许修改名称
                  />
                  {template && (
                    <p className="text-xs text-muted-foreground">
                      模版名称创建后不可修改
                    </p>
                  )}
                </div>

                {/* 邮件主题 */}
                <div className="space-y-2">
                  <Label htmlFor="template-subject">
                    邮件主题 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="例如：【告警】{{title}}"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    主题中可引用 {'{{'}title{'}}'}
                  </p>
                </div>

                {/* 邮件内容 */}
                <div className="space-y-2">
                  <Label htmlFor="template-content">
                    邮件内容 <span className="text-red-500">*</span>
                  </Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(html) => setFormData({ ...formData, content: html })}
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      使用富文本编辑器编辑邮件内容，支持格式化文本、列表、标题等
                    </p>
                  </div>
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <Label htmlFor="template-description">描述</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="模版的用途说明（可选）"
                    rows={2}
                  />
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : template ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
