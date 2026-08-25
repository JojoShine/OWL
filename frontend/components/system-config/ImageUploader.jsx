'use client';

import { useId, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/http-client';

export default function ImageUploader({
  label,
  value,
  onUpload,
  aspectRatio = 'square',
  maxSize = 2,
  height = 'h-48',
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const inputId = useId();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      alert(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('只能上传图片文件');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    onUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理图片 URL - 将相对路径转换为完整 URL
  const getFullImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>

      <div
        className={`
        relative overflow-hidden rounded-lg border border-dashed bg-muted/20 ${height}
        ${aspectRatio === 'square' ? 'aspect-square' : ''}
      `}
      >
        {value ? (
          <>
            {/* The API can return runtime image paths that are intentionally previewed as-is. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullImageUrl(value)}
              alt={label}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleDelete}
              disabled={uploading}
              aria-label={`删除${label}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <label htmlFor={inputId} className="flex h-full cursor-pointer flex-col items-center justify-center transition-colors hover:bg-muted/50">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {uploading ? '上传中...' : '点击上传'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              最大 {maxSize}MB
            </span>
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
