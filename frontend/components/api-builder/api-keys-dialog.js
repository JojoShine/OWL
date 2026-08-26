'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Lightbulb, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getFullApiUrl } from '@/lib/utils/api-url';

export default function ApiKeysDialog({ open, onOpenChange, interface_ }) {
  // 获取动态的API基础地址
  const getApiBaseUrl = () => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  };

  const apiBaseUrl = getApiBaseUrl();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const handleDownloadDoc = () => {
    const url = getFullApiUrl(interface_.endpoint);
    const params = interface_.parameters || [];

    // 生成参数表格
    let paramTable = '';
    if (params.length > 0) {
      paramTable = '## 请求参数\n\n';
      paramTable += '| 参数名 | 类型 | 是否必填 | 描述 |\n';
      paramTable += '|--------|------|----------|------|\n';
      paramTable += params.map(p =>
        `| ${p.name} | ${p.type} | ${p.required ? '是' : '否'} | ${p.description || '-'} |`
      ).join('\n');
    } else {
      paramTable = '## 请求参数\n\n无';
    }

    // 生成请求参数示例
    let paramExample = '';
    if (params.length > 0) {
      const sampleParams = {};
      params.forEach(param => {
        sampleParams[param.name] = `example_${param.name}`;
      });

      paramExample = '\n\n## 请求参数示例\n\n';
      if (interface_.method === 'GET') {
        const queryString = Object.entries(sampleParams)
          .map(([k, v]) => `${k}=${v}`)
          .join('&');
        paramExample += '```\n' + `${url}?${queryString}\n` + '```\n';
      } else {
        paramExample += '```json\n' + JSON.stringify(sampleParams, null, 2) + '\n' + '```\n';
      }
    }

    // 生成认证说明
    let authSection = '';
    if (interface_.require_auth) {
      authSection = '\n\n## 认证方式\n\n'
        + '### 方式一：换取 JWT Token\n\n'
        + '```bash\n'
        + `curl -X POST ${apiBaseUrl}/auth/api-token \\\n`
        + '  -H "Content-Type: application/json" \\\n'
        + '  -d \'{\n'
        + '    "app_id": "your-app-id",\n'
        + '    "app_key": "your-app-key"\n'
        + '  }\'\n'
        + '```\n\n'
        + '然后用返回的 token 调用接口：\n\n'
        + `\`\`\`bash\n`
        + `curl -X ${interface_.method} "${url}" \\\n`
        + `  -H "Authorization: Bearer YOUR_TOKEN"\n`
        + `\`\`\`\n\n`
        + '### 方式二：直接携带 API Key\n\n'
        + `\`\`\`bash\n`
        + `curl -X ${interface_.method} "${url}" \\\n`
        + `  -H "Authorization: Bearer YOUR_API_KEY"\n`
        + `\`\`\`\n`;
    } else {
      authSection = '\n\n## 认证方式\n\n该接口不需要认证，直接调用即可。\n';
    }

    // 生成 markdown 文档
    const markdown = `# ${interface_.name}\n\n`
      + `**请求方式：** ${interface_.method}  \n`
      + `**接口地址：** ${url}  \n`
      + `**描述：** ${interface_.description || '-'}  \n`
      + `**版本：** v${interface_.version}  \n`
      + `**是否需要认证：** ${interface_.require_auth ? '是' : '否'}\n\n`
      + paramTable
      + paramExample
      + authSection
      + '\n\n## 响应示例\n\n'
      + '```json\n'
      + '{\n'
      + '  "success": true,\n'
      + '  "data": [],\n'
      + '  "meta": { "rowCount": 0 }\n'
      + '}\n'
      + '```\n';

    // 触发下载
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${interface_.name || 'api-doc'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast.success('接口文档已下载');
  };

  // 生成示例参数
  const generateSampleParams = () => {
    if (!interface_.parameters || interface_.parameters.length === 0) {
      return {};
    }

    const params = {};
    interface_.parameters.forEach(param => {
      params[param.name] = `example_${param.name}`;
    });
    return params;
  };

  const sampleParams = generateSampleParams();
  const hasParams = Object.keys(sampleParams).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>接口调用说明</DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>接口 &quot;{interface_.name}&quot; 的调用方式</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDoc}
              title="下载接口文档"
            >
              <Download className="h-4 w-4 mr-2" />
              下载文档
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-x-hidden">
          {/* 接口信息 */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <h3 className="font-semibold text-base mb-3">接口信息</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">名称：</span>
                <span className="font-medium">{interface_.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">地址：</span>
                <code className="font-mono font-medium">{getFullApiUrl(interface_.endpoint)}</code>
              </div>
              <div>
                <span className="text-muted-foreground">方法：</span>
                <span className="font-medium">{interface_.method}</span>
              </div>
              <div>
                <span className="text-muted-foreground">需要认证：</span>
                <span className="font-medium">{interface_.require_auth ? '是' : '否'}</span>
              </div>
            </div>
          </div>

          {/* 调用流程 */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-base mb-4">调用流程</h3>

            {interface_.require_auth ? (
              <Tabs defaultValue="step1" className="w-full">
                <TabsList className="mb-5 grid w-full grid-cols-2">
                  <TabsTrigger value="step1">步骤 1：获取令牌</TabsTrigger>
                  <TabsTrigger value="step2">步骤 2：调用接口</TabsTrigger>
                </TabsList>

                {/* 步骤1：获取Token */}
                <TabsContent value="step1" className="space-y-3 mt-6">
                  <p className="text-sm mb-3">该接口需要认证。请先获取令牌，然后调用接口时在请求头中传递。</p>
                  <div className="text-xs mb-2 text-muted-foreground">使用 cURL 获取令牌：</div>
                  <div className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/50 p-3">
                    <code className="text-xs flex-1 font-mono break-words overflow-hidden">
                      {`curl -X POST ${apiBaseUrl}/auth/api-token \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "app_id": "your-app-id",\n    "app_key": "your-app-key"\n  }'`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`curl -X POST ${apiBaseUrl}/auth/api-token \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "app_id": "your-app-id",\n    "app_key": "your-app-key"\n  }'`)}
                      title="复制"
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xs mt-4 p-3 rounded bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <p>说明：</p>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      <li>从密钥管理页面获取您的 <code className="px-1 rounded bg-muted">app_id</code> 和 <code className="px-1 rounded bg-muted">app_key</code></li>
                      <li>执行上述 cURL 命令（替换实际的ID和密钥）</li>
                      <li>响应包含 <code className="px-1 rounded bg-muted">token</code> 字段</li>
                    </ul>
                  </div>
                </TabsContent>

                {/* 步骤2：使用Token调用接口 */}
                <TabsContent value="step2" className="space-y-3 mt-6">
                  <p className="text-sm mb-3">使用获取的令牌调用接口，在请求头中传递 <code className="px-1 rounded bg-muted">Authorization: Bearer {'{token}'}</code></p>

                  {hasParams && (
                    <>
                      <div className="text-xs mb-2 text-muted-foreground">请求参数示例：</div>
                      <div className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/50 p-3">
                        <code className="text-xs flex-1 font-mono break-words overflow-hidden">
                          {JSON.stringify(sampleParams, null, 2)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(sampleParams, null, 2))}
                          title="复制"
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="text-xs mt-3 mb-2 text-muted-foreground">cURL 示例：</div>
                  <div className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/50 p-3">
                    <code className="text-xs flex-1 font-mono break-words overflow-hidden">
                      {`curl -X ${interface_.method} ${getFullApiUrl(interface_.endpoint)}${interface_.method === 'GET' && hasParams ? '?' + Object.entries(sampleParams).map(([k, v]) => `${k}=${v}`).join('&') : ''} \\\n  -H "Authorization: Bearer YOUR_TOKEN"${interface_.method !== 'GET' && hasParams ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleParams)}'` : ''}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`curl -X ${interface_.method} ${getFullApiUrl(interface_.endpoint)}${interface_.method === 'GET' && hasParams ? '?' + Object.entries(sampleParams).map(([k, v]) => `${k}=${v}`).join('&') : ''} \\\n  -H "Authorization: Bearer YOUR_TOKEN"${interface_.method !== 'GET' && hasParams ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleParams)}'` : ''}`)}
                      title="复制"
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">该接口不需要认证，直接调用即可。</p>

                {hasParams && (
                  <>
                    <div className="text-xs mb-2 text-muted-foreground">请求参数示例：</div>
                    <div className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/50 p-3">
                      <code className="text-xs flex-1 font-mono break-words overflow-hidden">
                        {JSON.stringify(sampleParams, null, 2)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(sampleParams, null, 2))}
                        title="复制"
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                <div className="text-xs mb-2 text-muted-foreground">cURL 示例：</div>
                <div className="flex items-center gap-2 overflow-hidden rounded-md border bg-muted/50 p-3">
                  <code className="text-xs flex-1 font-mono break-words overflow-hidden">
                    {`curl -X ${interface_.method} ${getFullApiUrl(interface_.endpoint)}${interface_.method === 'GET' && hasParams ? '?' + Object.entries(sampleParams).map(([k, v]) => `${k}=${v}`).join('&') : ''}${interface_.method !== 'GET' && hasParams ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleParams)}'` : ''}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`curl -X ${interface_.method} ${getFullApiUrl(interface_.endpoint)}${interface_.method === 'GET' && hasParams ? '?' + Object.entries(sampleParams).map(([k, v]) => `${k}=${v}`).join('&') : ''}${interface_.method !== 'GET' && hasParams ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleParams)}'` : ''}`)}
                    title="复制"
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
