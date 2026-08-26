'use client';

import { Copy, Download, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getFullApiUrl } from '@/lib/utils/api-url';

export default function ApiKeysDialog({ open, onOpenChange, interface_ }) {
  const url = getFullApiUrl(interface_.endpoint);
  const sampleParams = Object.fromEntries((interface_.parameters || []).map((item) => [item.name, `example_${item.name}`]));
  const hasParams = Object.keys(sampleParams).length > 0;
  const requestUrl = interface_.method === 'GET' && hasParams
    ? `${url}?${new URLSearchParams(sampleParams).toString()}`
    : url;
  const curl = `curl -X ${interface_.method} "${requestUrl}"${interface_.require_auth ? ' \\\n  -H "X-API-Key: YOUR_API_KEY"' : ''}${interface_.method !== 'GET' && hasParams ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleParams)}'` : ''}`;

  const copy = async () => {
    await navigator.clipboard.writeText(curl);
    toast.success('调用示例已复制');
  };

  const download = () => {
    const markdown = `# ${interface_.name}\n\n- 请求方式：${interface_.method}\n- 接口地址：${url}\n- 版本：V${interface_.version}\n- 认证：${interface_.require_auth ? 'X-API-Key' : '无需认证'}\n\n## 调用示例\n\n\`\`\`bash\n${curl}\n\`\`\`\n`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    link.download = `${interface_.name || 'api'}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-7">
            <div><DialogTitle>接口调用说明</DialogTitle><DialogDescription className="mt-1">{interface_.name}</DialogDescription></div>
            <Button variant="outline" size="sm" onClick={download}><Download className="h-4 w-4" />下载文档</Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">请求方式</span><p className="mt-1 font-medium">{interface_.method}</p></div>
            <div><span className="text-muted-foreground">版本</span><p className="mt-1 font-medium">V{interface_.version}</p></div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">接口地址</span><code className="mt-1 block break-all text-xs">{url}</code></div>
          </div>
          {interface_.require_auth ? (
            <div className="flex gap-3 rounded-lg border p-4">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div><p className="font-medium">使用接口密钥认证</p><p className="mt-1 text-sm text-muted-foreground">在接口密钥页面为调用方授权当前接口，然后通过 X-API-Key 请求头传递一次性签发的完整密钥。</p></div>
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">cURL 示例</span><Button variant="ghost" size="sm" onClick={copy}><Copy className="h-4 w-4" />复制</Button></div>
            <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs"><code>{curl}</code></pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
