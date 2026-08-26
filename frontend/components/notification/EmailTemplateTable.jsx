'use client';

import React, { useState } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

export default function EmailTemplateTable({
  templates = [],
  onEdit,
  onDelete,
  onPreview,
  isLoading = false,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete && onDelete) {
      onDelete(templateToDelete.id);
    }
    setTemplateToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState title="暂无邮件模板" description="创建模板后会显示在这里" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模板名称</TableHead>
              <TableHead>主题</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {template.name}
                  </code>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={template.subject}>
                  {template.subject}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {template.description || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {template.updated_at ? formatDistanceToNow(new Date(template.updated_at), {
                    addSuffix: true,
                    locale: zhCN,
                  }) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(template)}
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(template)}
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(template)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setTemplateToDelete(null);
          }
        }}
        title="确认删除"
        description={templateToDelete
          ? `确定要删除模板 "${templateToDelete.name}" 吗？此操作无法撤销。`
          : '确定要删除该模板吗？此操作无法撤销。'}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTemplateToDelete(null)}
      />
    </>
  );
}
