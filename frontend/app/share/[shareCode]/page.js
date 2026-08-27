'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/lib/utils/http-client';
import { getApiBaseUrl } from '@/lib/utils/http-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Download, AlertCircle, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/file';

function ShareFrame({ children, wide = false }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <Card className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
        {children}
      </Card>
    </main>
  );
}

export default function SharePage() {
  const params = useParams();
  const shareCode = params.shareCode;
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/file-shares/${shareCode}`);
        setShare(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || '分享不存在或已过期');
        setShare(null);
      } finally {
        setLoading(false);
      }
    };

    if (shareCode) {
      fetchShare();
    }
  }, [shareCode]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`/file-shares/${shareCode}/download`, {
        responseType: 'blob',
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', share.file.original_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载失败:', err);
      setError('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <ShareFrame>
        <CardContent className="py-8">
          <Loading size="lg" text="正在加载分享内容..." />
        </CardContent>
      </ShareFrame>
    );
  }

  if (error) {
    return (
      <ShareFrame>
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <p className="mb-2 font-semibold text-foreground">分享不可用</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </ShareFrame>
    );
  }

  if (!share) {
    return (
      <ShareFrame>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">分享不存在</p>
        </CardContent>
      </ShareFrame>
    );
  }

  // 判断是否是图片
  const isImage = share.file.mime_type?.startsWith('image/');

  // 获取预览 URL
  const getPreviewUrl = () => {
    if (!isImage) return null;
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/system/files/${share.file.id}/preview-public`;
  };

  return (
    <ShareFrame wide>
        <CardHeader className="border-b pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>文件分享</CardTitle>
              <p className="text-sm text-muted-foreground">请确认文件信息后下载</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 图片预览 */}
          {isImage && (
            <div className="w-full overflow-hidden rounded-lg border bg-muted">
              {/* 分享链接是运行时文件地址，无法使用固定 Next Image loader。 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPreviewUrl()}
                alt={share.file.original_name}
                className="w-full h-auto object-contain max-h-96"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="grid gap-4 rounded-lg bg-muted/60 p-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">文件名</p>
              <p className="break-all text-sm font-medium">{share.file.original_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">文件大小</p>
              <p className="text-sm font-medium tabular-data">{formatFileSize(share.file.size)}</p>
            </div>
            {share.expires_at && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">过期时间</p>
              <p className="text-sm font-medium tabular-data">
                {new Date(share.expires_at).toLocaleString('zh-CN')}
              </p>
            </div>
            )}
          </div>

          {share.description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">描述</p>
              <p className="text-sm">{share.description}</p>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? '下载中...' : '下载文件'}
          </Button>
        </CardContent>
    </ShareFrame>
  );
}
