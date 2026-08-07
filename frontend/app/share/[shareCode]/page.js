'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/lib/utils/http-client';
import { getApiBaseUrl } from '@/lib/utils/http-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/file';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2">分享不可用</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">分享不存在</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>文件分享</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 图片预览 */}
          {isImage && (
            <div className="w-full rounded-lg overflow-hidden bg-slate-100">
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">文件名</p>
            <p className="font-semibold break-all">{share.file.original_name}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">文件大小</p>
            <p className="font-semibold">{formatFileSize(share.file.size)}</p>
          </div>

          {share.expires_at && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">过期时间</p>
              <p className="font-semibold">
                {new Date(share.expires_at).toLocaleString('zh-CN')}
              </p>
            </div>
          )}

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
      </Card>
    </div>
  );
}