'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * 动态详情页组件
 *
 * 功能：
 * 1. 根据pageConfig配置动态渲染详情页
 * 2. 支持字段分组（信息簇）展示
 * 3. 支持自定义字段格式化
 */
export default function DynamicDetailPage({
  pageConfig,
  recordId,
  data,
  onBack
}) {
  const router = useRouter();
  const [record, setRecord] = useState(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    setRecord(data || null);
    setLoading(false);
  }, [data, pageConfig, recordId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  /**
   * 格式化字段值
   */
  const formatFieldValue = (field, value) => {
    if (value === null || value === undefined) {
      return <span className="italic text-muted-foreground">-</span>;
    }

    // 根据formatType进行格式化
    if (field.formatType) {
      const options = field.formatOptions || {};

      switch (field.formatType) {
        case 'date':
          return new Date(value).toLocaleDateString('zh-CN');

        case 'datetime':
          return new Date(value).toLocaleString('zh-CN');

        case 'money':
          return `¥${parseFloat(value).toFixed(2)}`;

        case 'enum':
          if (field.codeMapping && field.codeMapping[value]) {
            return field.codeMapping[value];
          }
          return value;

        case 'mask':
          if (options.mask) {
            return value.replace(options.mask.pattern, options.mask.replacement);
          }
          return value;

        case 'link':
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {value}
            </a>
          );

        default:
          return value;
      }
    }

    // 默认格式化
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  if (loading) {
    return <Loading size="md" variant="spinner" />;
  }

  if (!record || !pageConfig) {
    return (
      <div className="rounded-lg border border-dashed bg-card">
        <EmptyState title="暂无详情数据" description="当前记录不存在或已被删除" />
      </div>
    );
  }

  const detailConfig = pageConfig.detailConfig || {};
  const fieldGroups = detailConfig.fieldGroups || [];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{pageConfig.description || pageConfig.moduleName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">详细信息</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* 字段分组展示 */}
      <div className="grid gap-6">
        {fieldGroups.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader>
              <CardTitle className="text-lg">{group.groupLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${group.columns || 2}, 1fr)`,
                }}
              >
                {group.fields.map((groupField, fieldIndex) => {
                  // 查找完整的字段配置
                  const fullField = pageConfig.fields.find(
                    f => f.name === groupField.fieldName
                  );

                  if (!fullField) return null;

                  const fieldValue = record[groupField.fieldName];

                  return (
                    <div key={fieldIndex} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {groupField.label}
                      </label>
                      <div className="text-sm text-foreground">
                        {formatFieldValue(fullField, fieldValue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 如果没有配置分组，显示所有字段 */}
        {fieldGroups.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">详细信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pageConfig.fields
                  .filter(f => f.showInList !== false)
                  .map((field, index) => (
                    <div key={index} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <div className="text-sm text-foreground">
                        {formatFieldValue(field, record[field.name])}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
