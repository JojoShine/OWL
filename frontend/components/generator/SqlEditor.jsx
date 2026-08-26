'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Check, AlertCircle, Database, Eye, EyeOff } from 'lucide-react';
import { generatorApi } from '@/lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * SQL编辑器组件
 *
 * 功能：
 * 1. SQL语法编辑（基于Textarea，可后续升级为Monaco Editor）
 * 2. 实时语法验证
 * 3. SQL预览查询结果
 * 4. 一键生成字段配置
 */
export default function SqlEditor({ value, onChange, onFieldsGenerated }) {
  const [sql, setSql] = useState(value || '');
  const [validationResult, setValidationResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  /**
   * 处理SQL变更
   */
  const handleSqlChange = (e) => {
    const newSql = e.target.value;
    setSql(newSql);
    if (onChange) {
      onChange(newSql);
    }
    // 清除之前的验证结果
    setValidationResult(null);
    setPreviewData(null);
  };

  /**
   * 验证SQL语法
   */
  const handleValidate = async () => {
    if (!sql.trim()) {
      setValidationResult({
        valid: false,
        error: 'SQL语句不能为空',
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await generatorApi.validateSql(sql);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error.response?.data?.message || '验证失败',
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * 预览SQL查询结果
   */
  const handlePreview = async () => {
    if (!sql.trim()) {
      setValidationResult({
        valid: false,
        error: 'SQL语句不能为空',
      });
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await generatorApi.previewSql(sql, 10);
      setPreviewData(result);
      setValidationResult({
        valid: true,
        message: `成功获取 ${result.length} 条预览数据`,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error.response?.data?.message || '预览失败',
      });
      setPreviewData(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  /**
   * 生成字段配置
   */
  const handleGenerateFields = async () => {
    if (!sql.trim()) {
      setValidationResult({
        valid: false,
        error: 'SQL语句不能为空',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const fields = await generatorApi.generateFieldsFromSql(sql);
      setValidationResult({
        valid: true,
        message: `成功生成 ${fields.length} 个字段配置`,
      });

      // 回调通知父组件
      if (onFieldsGenerated) {
        onFieldsGenerated(fields);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error.response?.data?.message || '生成字段配置失败',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          动态SQL编辑器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SQL编辑区 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">SQL查询语句</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlight(!showHighlight)}
              className="text-xs"
            >
              {showHighlight ? (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  隐藏高亮
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  显示高亮
                </>
              )}
            </Button>
          </div>

          {!showHighlight ? (
            <Textarea
              value={sql}
              onChange={handleSqlChange}
              placeholder="请输入SELECT查询语句，例如：&#10;SELECT u.id, u.name, d.name as department_name&#10;FROM users u&#10;LEFT JOIN departments d ON u.department_id = d.id&#10;WHERE u.is_active = true"
              className="font-mono text-sm min-h-[200px]"
              spellCheck={false}
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 overflow-hidden rounded-md">
                <SyntaxHighlighter
                  language="sql"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    minHeight: '200px',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {sql || '-- 请输入SQL查询语句'}
                </SyntaxHighlighter>
              </div>
              <Textarea
                value={sql}
                onChange={handleSqlChange}
                className="font-mono text-sm min-h-[200px] opacity-0 relative z-10"
                spellCheck={false}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            提示：只支持SELECT查询，支持多表JOIN，可使用WHERE条件过滤。点击右上角图标可切换语法高亮。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={isValidating || !sql.trim()}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                验证中...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                验证语法
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isPreviewing || !sql.trim()}
          >
            {isPreviewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                预览中...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                预览数据
              </>
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateFields}
            disabled={isGenerating || !sql.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                生成字段配置
              </>
            )}
          </Button>
        </div>

        {/* 验证结果提示 */}
        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            {validationResult.valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {validationResult.valid
                ? validationResult.message || 'SQL语法验证通过'
                : validationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* 预览数据表格 */}
        {previewData && previewData.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b bg-muted/40 px-4 py-2">
              <h4 className="text-sm font-medium">
                预览数据（前10条）
              </h4>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="sticky top-0 bg-muted/60">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      {Object.values(row).map((value, colIdx) => (
                        <td
                          key={colIdx}
                          className="whitespace-nowrap px-4 py-2 text-sm text-foreground"
                        >
                          {value === null ? (
                            <span className="italic text-muted-foreground">null</span>
                          ) : typeof value === 'object' ? (
                            JSON.stringify(value)
                          ) : (
                            String(value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
