
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from 'lucide-react';

/**
 * 确认对话框组件
 * 用于替代原生的 window.confirm()
 *
 * @param {boolean} open - 是否显示对话框
 * @param {function} onOpenChange - 对话框显示状态变化回调
 * @param {function} onConfirm - 确认回调
 * @param {function} onCancel - 取消回调（可选）
 * @param {string} title - 对话框标题
 * @param {string} description - 对话框描述
 * @param {string} confirmText - 确认按钮文本
 * @param {string} cancelText - 取消按钮文本
 * @param {string} variant - 确认按钮样式变体 (default, destructive, outline, secondary, ghost, link)
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = '确认操作',
  description = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  variant = 'destructive',
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
