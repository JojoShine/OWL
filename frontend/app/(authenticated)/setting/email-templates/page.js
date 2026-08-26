'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { emailTaskApi, emailTemplateApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import EmailTaskDialog from '@/components/notification/EmailTaskDialog';
import EmailTemplateFormDialog from '@/components/notification/EmailTemplateFormDialog';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

const frequencyMap = {
  once: '一次',
  hourly: '每小时',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
};

const statusMap = {
  pending: { label: '待执行', variant: 'secondary' },
  success: { label: '成功', variant: 'default' },
  failed: { label: '失败', variant: 'destructive' },
};

export default function EmailManagementPage() {
  const [activeView, setActiveView] = useState('tasks');

  // =============== 发送任务相关状态 ===============
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskSearchValues, setTaskSearchValues] = useState({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskPagination, setTaskPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmTaskDeleteOpen, setConfirmTaskDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // =============== 邮件模板相关状态 ===============
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateSearchValues, setTemplateSearchValues] = useState({});
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templatePagination, setTemplatePagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmTemplateDeleteOpen, setConfirmTemplateDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // =============== 发送任务相关方法 ===============

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const response = await emailTaskApi.getTasks({
        page: taskPagination.page,
        limit: taskPagination.pageSize,
      });
      const tasksData = response.data?.items || response.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      if (response.data?.pagination) {
        setTaskPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
      }
    } catch (error) {
      console.error('获取邮件任务列表失败:', error);
      setTasks([]);
      toast.error('获取邮件任务列表失败');
    } finally {
      setIsLoadingTasks(false);
    }
  }, [taskPagination.page, taskPagination.pageSize]);

  useEffect(() => {
    fetchTasks();
  }, [taskPagination.page, taskPagination.pageSize]);

  const handleTaskSearch = () => {
    setTaskPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchTasks(), 0);
  };

  const handleTaskReset = () => {
    setTaskSearchValues({});
    setTaskPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchTasks(), 0);
  };

  const handleTaskPageChange = (newPage) => {
    setTaskPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTaskPageSizeChange = (newPageSize) => {
    setTaskPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setConfirmTaskDeleteOpen(true);
  };

  const handleConfirmTaskDelete = async () => {
    if (!taskToDelete) return;

    try {
      await emailTaskApi.deleteTask(taskToDelete.id);
      toast.success('删除邮件任务成功');
      fetchTasks();
    } catch (error) {
      console.error('删除邮件任务失败:', error);
      toast.error('删除失败');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleExecuteTask = async (task) => {
    try {
      await emailTaskApi.executeTask(task.id);
      toast.success('邮件任务已提交执行');
      fetchTasks();
    } catch (error) {
      console.error('执行邮件任务失败:', error);
      toast.error('执行失败');
    }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editingTask) {
        await emailTaskApi.updateTask(editingTask.id, formData);
        toast.success('邮件任务更新成功');
      } else {
        await emailTaskApi.createTask(formData);
        toast.success('邮件任务创建成功');
      }
      setIsTaskDialogOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('保存邮件任务失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  // =============== 邮件模板相关方法 ===============

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await emailTemplateApi.getTemplates({
        page: templatePagination.page,
        limit: templatePagination.pageSize,
      });
      const templatesData = response.data?.items || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);

      if (response.data?.pagination) {
        setTemplatePagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
      }
    } catch (error) {
      console.error('获取邮件模板列表失败:', error);
      setTemplates([]);
      toast.error('获取邮件模板列表失败');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [templatePagination.page, templatePagination.pageSize]);

  useEffect(() => {
    fetchTemplates();
  }, [templatePagination.page, templatePagination.pageSize]);

  const handleTemplateSearch = () => {
    setTemplatePagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchTemplates(), 0);
  };

  const handleTemplateReset = () => {
    setTemplateSearchValues({});
    setTemplatePagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchTemplates(), 0);
  };

  const handleTemplatePageChange = (newPage) => {
    setTemplatePagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTemplatePageSizeChange = (newPageSize) => {
    setTemplatePagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (template) => {
    setTemplateToDelete(template);
    setConfirmTemplateDeleteOpen(true);
  };

  const handleConfirmTemplateDelete = async () => {
    if (!templateToDelete) return;

    try {
      await emailTemplateApi.deleteTemplate(templateToDelete.id);
      toast.success('删除邮件模板成功');
      fetchTemplates();
    } catch (error) {
      console.error('删除邮件模板失败:', error);
      toast.error('删除失败');
    } finally {
      setTemplateToDelete(null);
    }
  };

  const handleSaveTemplate = async (formData) => {
    try {
      if (editingTemplate) {
        await emailTemplateApi.updateTemplate(editingTemplate.id, formData);
        toast.success('邮件模板更新成功');
      } else {
        await emailTemplateApi.createTemplate(formData);
        toast.success('邮件模板创建成功');
      }
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('保存邮件模板失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  // =============== 发送任务表格列配置 ===============

  const taskSearchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索任务名称...',
    },
  ];

  const taskColumns = [
    {
      key: 'name',
      label: '任务名称',
      cellClassName: 'font-medium',
    },
    {
      key: 'frequency',
      label: '发送频率',
      render: (value) => frequencyMap[value] || '-',
    },
    {
      key: 'recipients',
      label: '收件人数',
      render: (value) => value.split(',').filter(e => e.trim()).length,
    },
    {
      key: 'last_status',
      label: '执行状态',
      render: (value) => (
        <Badge variant={statusMap[value]?.variant || 'secondary'}>
          {statusMap[value]?.label || '未知'}
        </Badge>
      ),
    },
    {
      key: 'last_executed_at',
      label: '最后执行时间',
      render: (value) =>
        value
          ? formatDistanceToNow(new Date(value), {
              addSuffix: true,
              locale: zhCN,
            })
          : '-',
    },
    {
      key: 'execution_count',
      label: '执行次数',
    },
    {
      key: 'enabled',
      label: '状态',
      render: (value) => (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? '启用' : '禁用'}
        </Badge>
      ),
    },
  ];

  // =============== 邮件模板表格列配置 ===============

  const templateSearchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索模板名称...',
    },
  ];

  const templateColumns = [
    {
      key: 'name',
      label: '模板名称',
      cellClassName: 'font-medium',
      render: (value) => (
        <code className="text-sm bg-muted px-2 py-1 rounded">
          {value}
        </code>
      ),
    },
    {
      key: 'subject',
      label: '邮件主题',
      render: (value) => (
        <div className="max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'description',
      label: '描述',
      render: (value) => (
        <div className="max-w-[200px] truncate">
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'updated_at',
      label: '更新时间',
      render: (value) =>
        value
          ? formatDistanceToNow(new Date(value), {
              addSuffix: true,
              locale: zhCN,
            })
          : '-',
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="邮件模板"
        description="维护系统邮件内容和变量。"
        actions={
          <Button onClick={handleAddTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            新增模板
          </Button>
        }
      />
      <PageWorkspace>
        <PageToolbar>
        <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="tasks">发送任务</TabsTrigger>
              <TabsTrigger value="templates">邮件模板</TabsTrigger>
            </TabsList>
            {activeView === 'tasks' ? (
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                新建任务
              </Button>
            ) : null}
          </div>
          {activeView === 'tasks' ? (
            <SearchFilter
              variant="toolbar"
              fields={taskSearchFields}
              values={taskSearchValues}
              onChange={setTaskSearchValues}
              onSearch={handleTaskSearch}
              onReset={handleTaskReset}
            />
          ) : (
            <SearchFilter
              variant="toolbar"
              fields={templateSearchFields}
              values={templateSearchValues}
              onChange={setTemplateSearchValues}
              onSearch={handleTemplateSearch}
              onReset={handleTemplateReset}
            />
          )}
        </Tabs>
        </PageToolbar>
        <PageSurface className="p-0">
        {activeView === 'tasks' ? (
          <DataTable
            variant="workspace"
            columns={taskColumns}
            data={tasks}
            loading={isLoadingTasks}
            pagination={taskPagination}
            onPageChange={handleTaskPageChange}
            onPageSizeChange={handleTaskPageSizeChange}
            actions={(task) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExecuteTask(task)}
                  title="立即执行"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditTask(task)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          />
        ) : (
          <DataTable
            variant="workspace"
            columns={templateColumns}
            data={templates}
            loading={isLoadingTemplates}
            pagination={templatePagination}
            onPageChange={handleTemplatePageChange}
            onPageSizeChange={handleTemplatePageSizeChange}
            actions={(template) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          />
        )}
        </PageSurface>
      </PageWorkspace>

      {/* 邮件任务表单弹窗 */}
      <EmailTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />

      {/* 邮件模板表单弹窗 */}
      <EmailTemplateFormDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      {/* 删除任务确认 */}
      <ConfirmDialog
        open={confirmTaskDeleteOpen}
        onOpenChange={setConfirmTaskDeleteOpen}
        onConfirm={handleConfirmTaskDelete}
        title="确认删除"
        description={
          taskToDelete
            ? `确定要删除邮件任务 "${taskToDelete.name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />

      {/* 删除模板确认 */}
      <ConfirmDialog
        open={confirmTemplateDeleteOpen}
        onOpenChange={setConfirmTemplateDeleteOpen}
        onConfirm={handleConfirmTemplateDelete}
        title="确认删除"
        description={
          templateToDelete
            ? `确定要删除邮件模板 "${templateToDelete.name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
