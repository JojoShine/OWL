'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2Icon, CodeIcon, TrashIcon, Trash2Icon } from 'lucide-react';

export default function ConfigsSection({
  configs,
  loading,
  onEdit,
  onGenerate,
  onDeleteCode,
  onDeleteConfig,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-4/5"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          暂无模块配置，请先从"数据库表"标签页初始化配置
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {configs.map((config) => (
        <Card key={config.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">{config.module_name}</CardTitle>
            {config.description && (
              <CardDescription className="text-sm">{config.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* 基本信息 */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">表名：</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{config.table_name}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">字段数：</span>
                <span>{config.fields?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态：</span>
                {config.page_config ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-xs">已生成</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">未生成</Badge>
                )}
              </div>
            </div>

            {/* 功能标签 */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">支持功能：</span>
              <div className="flex flex-wrap gap-1">
                {config.enable_create && <Badge variant="secondary" className="text-xs">新增</Badge>}
                {config.enable_update && <Badge variant="secondary" className="text-xs">编辑</Badge>}
                {config.enable_delete && <Badge variant="secondary" className="text-xs">删除</Badge>}
                {config.enable_batch_delete && <Badge variant="secondary" className="text-xs">批量删除</Badge>}
                {config.enable_export && <Badge variant="secondary" className="text-xs">导出</Badge>}
                {config.enable_import && <Badge variant="secondary" className="text-xs">导入</Badge>}
                {!config.enable_create && !config.enable_update && !config.enable_delete &&
                 !config.enable_batch_delete && !config.enable_export && !config.enable_import && (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(config)}
                className="flex-1"
                title="编辑配置"
              >
                <Settings2Icon className="w-4 h-4 mr-1" />
                编辑
              </Button>
              <Button
                size="sm"
                onClick={() => onGenerate(config)}
                className="flex-1"
                title="生成代码"
              >
                <CodeIcon className="w-4 h-4 mr-1" />
                生成
              </Button>
              {config.generated_files?.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDeleteCode(config.id)}
                  title="删除生成的代码"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteConfig(config.id)}
                title="删除配置"
              >
                <Trash2Icon className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
