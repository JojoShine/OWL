
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SignatureGuideDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>HMAC 签名接入说明</DialogTitle>
          <DialogDescription>适用于后台系统整合、数据同步和开放业务接口。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border p-4">
            <p className="font-medium">请求头</p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-xs"><code>{`X-API-Key: <api_key>\nX-Timestamp: <unix_timestamp_ms>\nX-Nonce: <random_nonce>\nX-Signature: <hmac_sha256_hex>`}</code></pre>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">签名原文</p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-xs"><code>{`HTTP_METHOD\nCANONICAL_PATH_AND_QUERY\nTIMESTAMP\nNONCE\nSHA256_BODY`}</code></pre>
            <p className="mt-3 text-muted-foreground">使用 API Secret 对签名原文执行 HMAC-SHA256。查询参数按键和值排序并统一编码；Nonce 每次请求必须唯一，时间差不得超过 5 分钟。</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">连通性验证</p>
            <p className="mt-2 text-muted-foreground">为密钥授权“接入连通性验证”后，请求 GET /api/public/integration/ping 验证签名实现。</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
