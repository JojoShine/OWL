
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';
import { toast } from '@/components/ui/toast';
import axios from '@/lib/utils/module-client';
import { usePermission } from '@/lib/hooks/usePermission';
import { useListQuery } from '@/lib/hooks/use-list-query';
import { DynamicFilters } from './DynamicFilters';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * 动态CRUD页面组件
 * 根据配置自动渲染完整的CRUD功能页面
 */
export function DynamicCrudPage({ config }) {
  const { canCreate: checkCreate, canUpdate: checkUpdate, canDelete: checkDelete } = usePermission();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    draftFilters: filters,
    setDraftFilters: setFilters,
    appliedFilters,
    pagination,
    submit: handleSearch,
    reset: handleResetFilters,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    setTotal,
  } = useListQuery();
  const [selectedRows, setSelectedRows] = useState([]);
  const [formDialog, setFormDialog] = useState({
    open: false,
    mode: 'create',
    data: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
  });
  const [batchDeleteDialog, setBatchDeleteDialog] = useState({
    open: false,
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [batchInfo, setBatchInfo] = useState({ current: 0, total: 0, successCount: 0, errorCount: 0, errors: [] });
  const fileInputRef = useRef(null);
  const latestRequestId = useRef(0);

  // 每批导入行数 & 每批超时时间
  const IMPORT_BATCH_SIZE = 500;
  const IMPORT_BATCH_TIMEOUT = 5 * 60 * 1000; // 5分钟

  // 从后端响应中提取导入结果（兼容不同响应格式）
  // 后端返回 failureCount 而非 errorCount，需兼容两种字段名
  const extractImportResult = (response) => {
    // 兼容拦截器解包和未解包两种情况
    // 解包: response = { success, successCount, failureCount, errors, message }
    // 未解包: response = { success: true, data: { success, successCount, ... }, message }
    const data = response?.data?.successCount !== undefined || response?.data?.failureCount !== undefined
      ? response.data   // 拦截器未解包，从 data 层提取
      : response;       // 拦截器已解包，直接使用

    return {
      success: data?.success ?? false,
      message: data?.message ?? '',
      successCount: data?.successCount ?? 0,
      failureCount: data?.failureCount ?? data?.errorCount ?? 0,
      errors: Array.isArray(data?.errors) ? data.errors : [],
    };
  };

  // 获取资源名称（modulePath 与数据库 permission_prefix 一致，格式如 test-products）
  const resource = config.modulePath;

  // 检查权限
  const canCreate = resource && checkCreate(resource);
  const canUpdate = resource && checkUpdate(resource);
  const canDelete = resource && checkDelete(resource);

  // 加载数据
  const fetchData = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      setLoading(true);
      const response = await axios.get(config.api.list, {
        params: {
          ...appliedFilters,
          page: pagination.page,
          limit: pagination.pageSize,
        },
      });

      // 处理不同的响应格式
      const responseData = response.data || {};
      const items = responseData.items || responseData.data || [];
      const total = responseData.pagination?.total || responseData.total || 0;

      if (requestId !== latestRequestId.current) return;
      setData(Array.isArray(items) ? items : []);
      setTotal(total);
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
      setData([]);
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, [appliedFilters, config.api.list, pagination.page, pagination.pageSize, setTotal]);

  // 初始加载和分页/筛选变化时加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 打开新增对话框
  const handleAdd = () => {
    if (!canCreate) {
      toast.error('您没有新增权限');
      return;
    }
    setFormDialog({
      open: true,
      mode: 'create',
      data: null,
    });
  };

  // 打开编辑对话框
  const handleEdit = (row) => {
    if (!canUpdate) {
      toast.error('您没有编辑权限');
      return;
    }
    setFormDialog({
      open: true,
      mode: 'edit',
      data: row,
    });
  };

  // 打开查看对话框
  const handleView = (row) => {
    setFormDialog({
      open: true,
      mode: 'view',
      data: row,
    });
  };

  // 提交表单
  const handleFormSubmit = async (formData) => {
    try {
      if (formDialog.mode === 'create') {
        await axios.post(config.api.create, formData);
        toast.success('创建成功');
      } else {
        const url = config.api.update.replace(':id', formDialog.data.id);
        await axios.put(url, formData);
        toast.success('更新成功');
      }
      setFormDialog({ open: false, mode: 'create', data: null });
      fetchData();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error(error.response?.data?.message || '操作失败');
      // 错误已通过 toast 显示，不再抛出以避免重复提示
    }
  };

  // 打开删除确认对话框
  const handleDelete = (row) => {
    if (!canDelete) {
      toast.error('您没有删除权限');
      return;
    }
    setDeleteDialog({
      open: true,
      id: row.id,
    });
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    try {
      const url = config.api.delete.replace(':id', deleteDialog.id);
      await axios.delete(url);
      toast.success('删除成功');
      setDeleteDialog({ open: false, id: null });
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(error.response?.data?.message || '删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (!canDelete) {
      toast.error('您没有删除权限');
      return;
    }
    if (selectedRows.length === 0) {
      toast.warning('请选择要删除的项');
      return;
    }
    setBatchDeleteDialog({ open: true });
  };

  // 确认批量删除
  const handleConfirmBatchDelete = async () => {
    try {
      // 批量删除逻辑（可能需要后端支持）
      await Promise.all(
        selectedRows.map((id) => {
          const url = config.api.delete.replace(':id', id);
          return axios.delete(url);
        })
      );
      toast.success(`成功删除 ${selectedRows.length} 项`);
      setBatchDeleteDialog({ open: false });
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error(error.response?.data?.message || '批量删除失败');
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(config.api.downloadTemplate);
      const template = response.data;

      // 使用 ExcelJS 创建 Excel 文件
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('数据');

      // 添加第一行：字段名（防止 undefined 导致 ExcelJS toString 报错）
      const headerRow = worksheet.addRow(template.fields.map(f => f.name || ''));
      headerRow.font = { bold: true };

      // 构建字段名到必填状态的映射（从 config.fields 的 formRules 中获取）
      const fieldRequiredMap = {};
      (config.fields || []).forEach(f => {
        fieldRequiredMap[f.name] = f.formRules && f.formRules.required;
      });

      // 添加第二行：中文注释（必填字段标红）
      const commentRow = worksheet.addRow(
        template.fields.map(f => {
          const isRequired = fieldRequiredMap[f.name];
          return isRequired ? `${f.comment || ''} (必填)` : f.comment || '';
        })
      );

      // 设置必填字段的红色文字样式
      template.fields.forEach((field, index) => {
        const isRequired = fieldRequiredMap[field.name];
        if (isRequired) {
          const cell = commentRow.getCell(index + 1);
          cell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }
      });

      // 设置列宽
      template.fields.forEach((field, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max((field.name || '').length, (field.comment || '').length, 12);
      });

      // 生成 Excel 文件
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.moduleName}_导入模板.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      toast.error('下载模板失败');
    }
  };

  // 处理文件选择（分批提交）
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      setImportResult(null);
      setImportProgress(0);
      setBatchInfo({ current: 0, total: 0, successCount: 0, errorCount: 0, errors: [] });

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          setImportProgress(10);

          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const worksheet = workbook.Sheets['数据'] || workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          if (rows.length === 0) {
            toast.error('Excel 文件中没有数据');
            setImportLoading(false);
            setImportProgress(0);
            return;
          }

          // 跳过注释行
          const actualData = rows.slice(1);

          if (actualData.length === 0) {
            toast.error('Excel 文件中没有实际数据，请从第三行开始填入数据');
            setImportLoading(false);
            setImportProgress(0);
            return;
          }

          setImportProgress(20);

          // 分批提交
          const batches = [];
          for (let i = 0; i < actualData.length; i += IMPORT_BATCH_SIZE) {
            batches.push(actualData.slice(i, i + IMPORT_BATCH_SIZE));
          }

          setBatchInfo({ current: 0, total: batches.length, successCount: 0, errorCount: 0, errors: [] });

          let totalSuccess = 0;
          let totalErrors = [];
          let hasFailure = false;

          for (let i = 0; i < batches.length; i++) {
            const batchProgress = 20 + Math.floor(((i + 1) / batches.length) * 70);
            setImportProgress(batchProgress);
            setBatchInfo((prev) => ({ ...prev, current: i + 1 }));

            try {
              // 每批设置 5 分钟超时
              const result = await axios.post(
                config.api.import,
                { rows: batches[i] },
                { timeout: IMPORT_BATCH_TIMEOUT }
              );

              // 拦截器返回的是完整响应体 { success, data, message }，实际导入结果在 result.data 中
              const batchResult = extractImportResult(result.data);
              if (batchResult.successCount) totalSuccess += batchResult.successCount;
              if (batchResult.errors.length) {
                totalErrors = totalErrors.concat(batchResult.errors);
              }
              if (!batchResult.success) hasFailure = true;

              // 实时更新批次进度
              setBatchInfo((prev) => ({
                ...prev,
                successCount: totalSuccess,
                errorCount: totalErrors.length,
              }));
            } catch (err) {
              hasFailure = true;
              if (err.code === 'ECONNABORTED') {
                totalErrors.push({
                  row: null, field: '', fieldLabel: '', columnNum: null,
                  message: `第 ${i + 1} 批导入超时（超过5分钟）`,
                });
              } else {
                // 尝试提取后端返回的行级错误（如数据库插入失败的详细错误）
                // err.response.data 是完整响应体 { success, message, data: { success, failureCount, errors } }
                // 实际导入结果在 err.response.data.data 中
                const errResponse = err.response;
                const errBody = errResponse?.data;
                const errData = errBody ? extractImportResult(errBody.data || errBody) : null;
                if (errData?.errors?.length) {
                  // 后端返回了行级错误，加上批次前缀以便区分
                  errData.errors.forEach((e) => {
                    totalErrors.push({
                      ...e,
                      message: `[第 ${i + 1} 批] ${e.message}`,
                    });
                  });
                  if (errData.successCount) totalSuccess += errData.successCount;
                } else {
                  const msg = errData?.message || `第 ${i + 1} 批导入失败`;
                  totalErrors.push({
                    row: null, field: '', fieldLabel: '', columnNum: null,
                    message: msg,
                  });
                }
              }

              // 实时更新批次进度
              setBatchInfo((prev) => ({
                ...prev,
                successCount: totalSuccess,
                errorCount: totalErrors.length,
              }));
            }
          }

          setImportProgress(95);

          const finalResult = {
            success: !hasFailure,
            message: hasFailure
              ? `导入完成，成功 ${totalSuccess} 条，失败 ${totalErrors.length} 条`
              : `导入成功，共 ${totalSuccess} 条`,
            successCount: totalSuccess,
            errorCount: totalErrors.length,
            errors: totalErrors,
          };

          setImportResult(finalResult);
          setImportProgress(100);

          if (!hasFailure) {
            toast.success(finalResult.message);
            setTimeout(() => {
              fetchData();
              setImportLoading(false);
              setImportProgress(0);
            }, 1200);
          } else {
            if (totalSuccess > 0) fetchData();
            setImportDialogOpen(true);
            setImportLoading(false);
          }
        } catch (error) {
          console.error('导入失败:', error);
          const errorMessage = error.response?.data?.message || '导入失败，请检查网络连接或联系管理员';
          setImportResult({
            success: false,
            message: '导入失败',
            successCount: 0,
            errorCount: 1,
            errors: [{ row: null, field: '', fieldLabel: '', columnNum: null, message: errorMessage }],
          });
          setImportDialogOpen(true);
          setImportLoading(false);
          setImportProgress(0);
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('处理文件失败:', error);
      toast.error('处理文件失败');
      setImportLoading(false);
      setImportProgress(0);
    }
  };

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <PageShell>
      <PageHeader
        title={config.description || config.moduleName}
        description={config.description ? `管理${config.description}` : '管理模块数据'}
        meta={<span className="text-sm text-muted-foreground">共 {pagination.total} 条记录</span>}
        actions={(
          <>
            {config.features?.batchDelete && selectedRows.length > 0 && canDelete && (
              <Button variant="destructive" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                批量删除 ({selectedRows.length})
              </Button>
            )}
            {config.features?.import && canCreate && (
              <>
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  下载模板
                </Button>
                <Button variant="outline" onClick={handleImportClick} disabled={importLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
            {config.features?.create && canCreate && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                新增
              </Button>
            )}
          </>
        )}
      />

      {/* 导入进度遮罩层 */}
      {importLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-[420px] p-6 shadow-lg">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">数据导入中</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {batchInfo.total > 1
                    ? `正在提交第 ${batchInfo.current} / ${batchInfo.total} 批`
                    : '正在处理您的文件，请稍候...'}
                </p>
              </div>
              <Progress value={importProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {importProgress === 0 ? '准备中...' : importProgress === 100 ? '处理完成' : `${importProgress}%`}
                </span>
                {batchInfo.total > 1 && <span>已成功 {batchInfo.successCount} 条</span>}
              </div>
              {batchInfo.total > 1 && (
                <p className="text-center text-xs text-muted-foreground">
                  每批最多 {IMPORT_BATCH_SIZE} 条，单批超时 5 分钟自动中止
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 导入结果 Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                <DialogTitle className="text-xl">导入结果</DialogTitle>
                <DialogDescription className="text-base">
                  {importResult?.message}
                </DialogDescription>
              </DialogHeader>

              {importResult?.errors && importResult.errors.length > 0 && (
                <>
                  <div className="px-6 pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-destructive">
                        共发现 {importResult.errors.length} 个错误
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                    <div className="space-y-2">
                      {importResult.errors.map((error, idx) => {
                        // 查找字段配置以获取中文注释
                        const fieldConfig = config.fields?.find(f => f.name === error.field);
                        const fieldLabel = fieldConfig?.label || fieldConfig?.formLabel || error.field;

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 hover:bg-destructive/15 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-xs font-semibold mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                                  {error.row && (
                                    <span className="font-semibold text-sm">
                                      第 {error.row} 行
                                    </span>
                                  )}
                                  {error.columnNum && (
                                    <span className="text-xs text-muted-foreground">
                                      第 {error.columnNum} 列
                                    </span>
                                  )}
                                  {error.field && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                      {fieldLabel}
                                      {error.field !== fieldLabel && (
                                        <span className="text-muted-foreground ml-1">({error.field})</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-destructive break-words">
                                  {error.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="px-6 py-4 border-t flex-shrink-0">
                <Button onClick={() => setImportDialogOpen(false)} className="w-full">
                  确定
                </Button>
              </div>
            </DialogContent>
      </Dialog>

      <PageWorkspace>
        {/* 筛选器 */}
        {config.fields?.some((field) => field.isSearchable) && (
          <PageToolbar>
            <DynamicFilters
              fields={config.fields}
              filters={filters}
              onChange={setFilters}
              onSearch={handleSearch}
              onReset={handleResetFilters}
            />
          </PageToolbar>
        )}

        <PageSurface className="p-0">
          {/* 数据表格 */}
          <DynamicTable
            data={data}
            fields={config.fields}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            features={{
              update: config.features?.update && canUpdate,
              delete: config.features?.delete && canDelete,
              batchDelete: config.features?.batchDelete && canDelete,
            }}
          />

          {/* 分页 */}
          {pagination.total > 0 && (
            <Pagination
              className="border-t px-4 py-3"
              page={pagination.page}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </PageSurface>
      </PageWorkspace>

      {/* 表单对话框 */}
      <DynamicForm
        open={formDialog.open}
        onOpenChange={(open) =>
          setFormDialog((prev) => ({ ...prev, open }))
        }
        fields={config.fields}
        data={formDialog.data}
        mode={formDialog.mode}
        onSubmit={handleFormSubmit}
        title={
          formDialog.mode === 'create'
            ? `新增${config.description || ''}`
            : formDialog.mode === 'view'
            ? `查看${config.description || ''}`
            : `编辑${config.description || ''}`
        }
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        description="确定要删除这条记录吗？此操作无法撤销。"
        variant="destructive"
      />

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        open={batchDeleteDialog.open}
        onOpenChange={(open) => setBatchDeleteDialog({ open })}
        onConfirm={handleConfirmBatchDelete}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedRows.length} 条记录吗？此操作无法撤销。`}
        variant="destructive"
      />
    </PageShell>
  );
}
