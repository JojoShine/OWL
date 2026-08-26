'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Copy } from 'lucide-react';
import { apiBuilderApi } from '@/lib/api';
import { getFullApiUrl } from '@/lib/utils/api-url';
import { toast } from 'sonner';

export default function TestInterfaceDialog({ open, onOpenChange, interface_ }) {
  const [params, setParams] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAddParam = () => {
    setParams({ ...params, newParam: '' });
  };

  const handleParamChange = (key, value) => {
    setParams({ ...params, [key]: value });
  };

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiBuilderApi.testInterface(interface_.id, params);
      // response已经被axios拦截器自动解包，所以response.data是真实的数据结构
      setResult(response.data || null);
      toast.success('接口测试成功');
    } catch (error) {
      console.error('接口测试失败:', error);
      // 优先获取后端返回的错误信息
      let errorMsg = '接口测试失败';

      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>测试接口</DialogTitle>
          <DialogDescription>
            {interface_.method} {getFullApiUrl(interface_.endpoint)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-4">
          {/* 参数输入和执行测试 */}
          {interface_.parameters && interface_.parameters.length > 0 ? (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-4">接口参数</h3>
              <div className="space-y-3 mb-4">
                {interface_.parameters.map((paramDef) => (
                  <div key={paramDef.name}>
                    <Label className="text-base font-medium">
                      {paramDef.name}
                      {paramDef.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="text-sm text-muted-foreground ml-2">({paramDef.type})</span>
                    </Label>
                    <Input
                      placeholder={paramDef.description || `输入 ${paramDef.name}`}
                      value={params[paramDef.name] || ''}
                      onChange={(e) => handleParamChange(paramDef.name, e.target.value)}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleTest} disabled={isLoading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? '测试中...' : '执行测试'}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border p-4">
              <Button onClick={handleTest} disabled={isLoading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? '测试中...' : '执行测试'}
              </Button>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 结果展示 */}
          {result && (
            <div className="flex flex-col rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">测试结果</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    总记录数：<strong>{result?.rowCount || 0}</strong> 条
                    {(result?.rowCount || 0) > 5 && <span className="ml-2">（显示前5条）</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const rows = Array.isArray(result?.rows) ? result.rows : (Array.isArray(result) ? result : []);
                      const displayData = rows.slice(0, 5);
                      copyToClipboard(JSON.stringify(displayData, null, 2));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <pre className="max-h-[300px] flex-1 overflow-y-auto rounded-md border bg-foreground p-3 text-sm text-background">
                {(() => {
                  const rows = Array.isArray(result?.rows) ? result.rows : (Array.isArray(result) ? result : []);
                  return JSON.stringify(rows.slice(0, 5), null, 2);
                })()}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
