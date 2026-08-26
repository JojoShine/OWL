'use client';

import { useState, useEffect } from 'react';
import { dashboardWidgetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';
import { toast } from 'sonner';
import { Edit, Play, BookOpen, Copy, Check } from 'lucide-react';

const CHART_TYPES = [
  { value: 'bar', label: '柱状图' },
  { value: 'line', label: '折线图' },
  { value: 'area', label: '面积图' },
  { value: 'pie', label: '饼图' },
];

function Section({ title, children }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1">
      <p className="font-medium text-foreground">{title}</p>
      <div className="relative group">
        <pre className="bg-muted rounded-md px-3 py-2 text-xs font-mono whitespace-pre overflow-x-auto pr-8">{children}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/20"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

export default function DashboardWidgetsPage() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // fetchWidgets intentionally refreshes only when the visible page changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWidgets(page); }, [page]);

  const fetchWidgets = async (pageNum) => {
    try {
      setLoading(true);
      const response = await dashboardWidgetApi.getAll();
      const allWidgets = response.data?.items || [];
      setTotal(allWidgets.length);
      
      // 前端分页
      const start = (pageNum - 1) * limit;
      const end = start + limit;
      setWidgets(allWidgets.slice(start, end));
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (widget) => {
    setEditingWidget(widget);
    setSqlQuery(widget.sql_query);
    setEnabled(widget.enabled);
    setTestResult(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!sqlQuery.trim()) { toast.error('请填写 SQL'); return; }
    setSaving(true);
    try {
      await dashboardWidgetApi.update(editingWidget.id, { sql_query: sqlQuery, enabled });
      toast.success('保存成功');
      setDialogOpen(false);
      fetchWidgets();
    } catch (err) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // 先保存再测试
      await dashboardWidgetApi.update(editingWidget.id, { sql_query: sqlQuery, enabled });
      const response = await dashboardWidgetApi.execute(editingWidget.id);
      setTestResult({ success: true, data: response.data?.data || [] });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const columns = [
    { key: 'sort_order', label: '序号', render: (v) => <span className="text-muted-foreground">{v}</span> },
    { key: 'title', label: '标题', cellClassName: 'font-medium' },
    {
      key: 'widget_type',
      label: '类型',
      render: (v) => <Badge variant="outline">{v === 'chart' ? '图表' : '数字指标'}</Badge>,
    },
    {
      key: 'chart_type',
      label: '图表类型',
      render: (v, row) => row.widget_type === 'chart'
        ? (CHART_TYPES.find(c => c.value === v)?.label || v)
        : '-',
    },
    {
      key: 'enabled',
      label: '状态',
      render: (v) => <Badge variant={v ? 'default' : 'secondary'}>{v ? '启用' : '禁用'}</Badge>,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="概览 Widget 配置"
        description="编辑各卡片的 SQL 查询，数据将实时展示在概览页面。"
        actions={(
          <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" />
            SQL 帮助
          </Button>
        )}
      />
      <PageSurface className="p-5 lg:p-3">
        <DataTable
          variant="workspace"
          columns={columns}
          data={widgets}
          loading={loading}
          emptyText="暂无 Widget 数据，请执行数据库初始化"
          pagination={{ page, total, pageSize: limit }}
          onPageChange={setPage}
          actions={(row) => (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(row)}
                aria-label={`编辑 Widget ${row.title}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </PageSurface>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑 Widget：{editingWidget?.title}</DialogTitle>
            <DialogDescription>
              修改 SQL 查询以自定义概览数据，仅支持 SELECT 语句
            </DialogDescription>
          </DialogHeader>
          {editingWidget && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">类型：</span>
                  {editingWidget.widget_type === 'chart' ? '图表' : '数字指标'}
                </div>
                {editingWidget.widget_type === 'chart' && (
                  <div>
                    <span className="text-muted-foreground">图表类型：</span>
                    {CHART_TYPES.find(c => c.value === editingWidget.chart_type)?.label}
                  </div>
                )}
                {editingWidget.x_key && (
                  <div>
                    <span className="text-muted-foreground">X 轴字段：</span>
                    <code className="bg-muted px-1 rounded">{editingWidget.x_key}</code>
                  </div>
                )}
                {editingWidget.data_key && (
                  <div>
                    <span className="text-muted-foreground">数值字段：</span>
                    <code className="bg-muted px-1 rounded">{editingWidget.data_key}</code>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>SQL 查询（只允许 SELECT）</Label>
                {editingWidget.widget_type === 'metric' ? (
                  <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">数字指标 SQL 说明</p>
                    <p>查询须返回单行单列，列名即为展示的数值字段（对应“数值字段”配置）。</p>
                    <p>示例：</p>
                    <code className="block bg-muted rounded px-2 py-1 font-mono">
                      SELECT COUNT(*) AS value FROM owl_users WHERE enabled = true
                    </code>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">图表 SQL 说明</p>
                    <p>查询须返回多行数据，每行包含 X 轴字段和数值字段（对应上方“X 轴字段”和“数值字段”配置）。</p>
                    {editingWidget.chart_type === 'pie' ? (
                      <>
                        <p>饼图示例（name 为分类，value 为数值）：</p>
                        <code className="block bg-muted rounded px-2 py-1 font-mono whitespace-pre">
                          {`SELECT role AS name, COUNT(*) AS value\nFROM owl_users GROUP BY role`}
                        </code>
                      </>
                    ) : (
                      <>
                        <p>折线/柱状/面积图示例（date 为 X 轴，count 为数值）：</p>
                        <code className="block bg-muted rounded px-2 py-1 font-mono whitespace-pre">
                          {`SELECT DATE(created_at) AS date, COUNT(*) AS count\nFROM owl_users\nGROUP BY DATE(created_at)\nORDER BY date DESC LIMIT 7`}
                        </code>
                      </>
                    )}
                  </div>
                )}
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                  <Label>启用</Label>
                </div>
                <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                  <Play className="h-4 w-4 mr-1" />
                  {testing ? '执行中...' : '测试 SQL'}
                </Button>
              </div>
              {testResult && (
                <div className={`rounded-md p-3 text-sm font-mono whitespace-pre-wrap ${testResult.success ? 'bg-muted' : 'bg-destructive/10 text-destructive'}`}>
                  {testResult.success
                    ? `返回 ${testResult.data.length} 条数据：\n${JSON.stringify(testResult.data.slice(0, 3), null, 2)}`
                    : `错误：${testResult.error}`}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>SQL 查询帮助文档</DialogTitle>
            <DialogDescription>PostgreSQL 常用查询语法参考，仅支持 SELECT 语句</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 text-sm overflow-y-auto flex-1">
            <Section title="数字指标：返回单个数值">
              {`-- 统计总数\nSELECT COUNT(*) AS value FROM 表名;\n\n-- 条件统计\nSELECT COUNT(*) AS value FROM 表名 WHERE 条件列 = '值';\n\n-- 求和\nSELECT SUM(数值列) AS value FROM 表名;\n\n-- 计算天数差（如系统运行天数）\nSELECT EXTRACT(DAY FROM NOW() - MIN(created_at))::int AS value FROM 表名;`}
            </Section>
            <Section title="折线 / 柱状 / 面积图：按时间分组">
              {`-- 按天统计（最近 7 天）\nSELECT\n  TO_CHAR(created_at, 'MM-DD') AS date,\n  COUNT(*) AS count\nFROM 表名\nWHERE created_at >= NOW() - INTERVAL '7 days'\nGROUP BY TO_CHAR(created_at, 'MM-DD')\nORDER BY MIN(created_at);\n\n-- 按月统计\nSELECT\n  TO_CHAR(created_at, 'YYYY-MM') AS month,\n  COUNT(*) AS count\nFROM 表名\nGROUP BY TO_CHAR(created_at, 'YYYY-MM')\nORDER BY month;`}
            </Section>
            <Section title="饼图：按分类统计占比">
              {`-- 按某列分类统计\nSELECT\n  分类列 AS name,\n  COUNT(*) AS value\nFROM 表名\nGROUP BY 分类列\nORDER BY value DESC;\n\n-- 使用 CASE 自定义分类标签\nSELECT\n  CASE\n    WHEN 数值列 > 100 THEN '大'\n    WHEN 数值列 > 10  THEN '中'\n    ELSE '小'\n  END AS name,\n  COUNT(*) AS value\nFROM 表名\nGROUP BY 1;`}
            </Section>
            <Section title="常用 PostgreSQL 日期函数">
              {`NOW()                          -- 当前时间\nCURRENT_DATE                   -- 当前日期\nNOW() - INTERVAL '7 days'      -- 7 天前\nDATE_TRUNC('day', created_at)  -- 截断到天\nTO_CHAR(created_at, 'YYYY-MM-DD') -- 格式化日期\nEXTRACT(HOUR FROM created_at)  -- 提取小时`}
            </Section>
            <Section title="常用聚合函数">
              {`COUNT(*)          -- 行数\nCOUNT(DISTINCT 列) -- 去重计数\nSUM(列)            -- 求和\nAVG(列)            -- 平均值\nMAX(列)            -- 最大值\nMIN(列)            -- 最小值`}
            </Section>
            <Section title="子查询示例">
              {`-- 用子查询计算占比\nSELECT\n  分类列 AS name,\n  COUNT(*) AS value,\n  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM 表名), 1) AS pct\nFROM 表名\nGROUP BY 分类列;`}
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
