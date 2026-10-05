
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IconPicker } from '@/components/ui/icon-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Eye, CheckCircle2 } from 'lucide-react';
import { menuApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { menuSchema } from '@/lib/schemas';

export default function MenuFormDialog({ open, onOpenChange, menu, onSuccess }) {
  const isEdit = !!menu?.id;
  const [parentMenus, setParentMenus] = useState([]);
  const [permissionPreview, setPermissionPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [autoGeneratePermission, setAutoGeneratePermission] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: '',
      path: '',
      component: '',
      icon: '',
      type: 'menu',
      visible: true,
      sort: 0,
      status: 'active',
      permission_code: '',
    },
  });

  // 获取父级菜单列表
  useEffect(() => {
    const fetchParentMenus = async () => {
      try {
        const response = await menuApi.getMenuTree();
        setParentMenus(response.data || []);
      } catch (error) {
        console.error('获取父级菜单失败:', error);
      }
    };
    if (open) {
      fetchParentMenus();
    }
  }, [open]);

  // 当menu变化时，更新表单
  useEffect(() => {
    if (menu) {
      reset({
        name: menu.name || '',
        path: menu.path || '',
        component: menu.component || '',
        icon: menu.icon || '',
        type: menu.type || 'menu',
        visible: menu.visible !== undefined ? menu.visible : true,
        sort: menu.sort || 0,
        status: menu.status || 'active',
        permission_code: menu.permission_code || '',
      });
    } else {
      reset({
        name: '',
        path: '',
        component: '',
        icon: '',
        type: 'menu',
        visible: true,
        sort: 0,
        status: 'active',
        permission_code: '',
      });
    }
  }, [menu, reset]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        parent_id: menu?.parent_id || null,
        auto_generate_permission: autoGeneratePermission,
      };

      if (isEdit) {
        await menuApi.updateMenu(menu.id, submitData);
      } else {
        await menuApi.createMenu(submitData);
      }

      toast.success(menu && menu.id ? '更新菜单成功' : '创建菜单成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
      setPermissionPreview(null);
    } catch (error) {
      console.error('保存菜单失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  // 预览权限
  const handlePreviewPermissions = useCallback(async (values) => {
    const formData = values || watch();

    if (!formData.name || !formData.path) {
      toast.error('请先填写菜单名称和路由路径');
      return;
    }

    try {
      setIsPreviewLoading(true);
      const response = await menuApi.previewPermissions({
        name: formData.name,
        path: formData.path,
        menu_type: 'business', // 可以根据实际情况调整
        permission_code: formData.permission_code,
      });

      setPermissionPreview(response.data);
    } catch (error) {
      console.error('预览权限失败:', error);
      toast.error('预览权限失败');
    } finally {
      setIsPreviewLoading(false);
    }
  }, [watch]);

  // 监听路径变化，自动预览权限
  useEffect(() => {
    let timer;
    const subscription = watch((value, { name: fieldName }) => {
      if ((fieldName === 'path' || fieldName === 'name') && value.path && value.name && autoGeneratePermission) {
        clearTimeout(timer);
        timer = setTimeout(() => handlePreviewPermissions(value), 500);
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [watch, autoGeneratePermission, handlePreviewPermissions]);

  const typeValue = watch('type');
  const statusValue = watch('status');
  const visibleValue = watch('visible');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑菜单' : '新增菜单'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改菜单信息' : '填写新菜单信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 菜单名称 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">
                菜单名称 <span className="text-destructive">*</span>
              </Label>
              <Controller name={'name'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="name"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="请输入菜单名称"
                />
              )} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 路由路径 */}
            <div className="space-y-2">
              <Label htmlFor="path">路由路径</Label>
              <Controller name={'path'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="path"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="/dashboard/example"
                />
              )} />
            </div>

            {/* 组件路径 */}
            <div className="space-y-2">
              <Label htmlFor="component">组件路径</Label>
              <Controller name={'component'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="component"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="ExamplePage"
                />
              )} />
            </div>

            {/* 图标 */}
            <div className="space-y-2">
              <Label htmlFor="icon">图标</Label>
              <IconPicker
                value={watch('icon')}
                onChange={(value) => setValue('icon', value)}
                placeholder="选择图标"
              />
            </div>

            {/* 权限代码 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="permission_code">权限代码</Label>
              <Controller name={'permission_code'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="permission_code"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="留空则自动生成，如：user:read"
                />
              )} />
              <p className="text-xs text-muted-foreground">
                留空将自动生成权限，也可以手动指定权限代码
              </p>
            </div>

            {/* 自动生成权限开关 */}
            {!isEdit && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_generate">自动生成权限</Label>
                  <Switch
                    id="auto_generate"
                    checked={autoGeneratePermission}
                    onCheckedChange={setAutoGeneratePermission}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  开启后将自动创建该资源的4个CRUD权限（create、read、update、delete）
                </p>
              </div>
            )}

            {/* 菜单类型 */}
            <div className="space-y-2">
              <Label>菜单类型</Label>
              <Select
                value={typeValue}
                onValueChange={(value) => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu">菜单</SelectItem>
                  <SelectItem value="button">按钮</SelectItem>
                  <SelectItem value="link">链接</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 状态 */}
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={statusValue}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 排序 */}
            <div className="space-y-2">
              <Label htmlFor="sort">排序</Label>
              <Controller name={'sort'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="sort"
                  type="number"
                  {...controlledField} value={Number.isNaN(controlledField.value) ? "" : controlledField.value ?? ""} onChange={(event) => controlledField.onChange(event.target.value === "" ? NaN : Number(event.target.value))}
                  placeholder="数字越小越靠前"
                />
              )} />
            </div>

            {/* 是否显示 */}
            <div className="space-y-2">
              <Label htmlFor="visible">是否显示</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="visible"
                  checked={visibleValue}
                  onCheckedChange={(checked) => setValue('visible', checked)}
                />
                <Label htmlFor="visible" className="!mt-0 cursor-pointer">
                  {visibleValue ? '显示' : '隐藏'}
                </Label>
              </div>
            </div>
          </div>

          {/* 权限预览 */}
          {!isEdit && autoGeneratePermission && permissionPreview && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm">
                {permissionPreview.permissions && permissionPreview.permissions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      将自动创建 {permissionPreview.permissions.length} 个权限
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {permissionPreview.permissions.map((perm, index) => (
                        <Badge
                          key={index}
                          variant={perm.code === permissionPreview.menuPermissionCode ? "default" : "outline"}
                          className="text-xs"
                        >
                          {perm.code}
                          {perm.code === permissionPreview.menuPermissionCode && " (菜单关联)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-green-700 dark:text-green-300">
                    该菜单无需生成权限（父级菜单）
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 重要提示 */}
          <Alert variant="info">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription >
              <strong>重要提示：</strong>创建菜单后，需要在<strong>角色管理</strong>中为相应角色分配此菜单，用户才能在侧边栏看到该菜单。
            </AlertDescription>
          </Alert>

          {/* 说明文字 */}
          <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <p>• 路由路径：菜单对应的前端路由地址</p>
            <p>• 组件路径：对应的页面组件名称</p>
            <p>• 图标：点击选择图标或输入 lucide-react 图标名称</p>
            <p>• 权限代码：访问此菜单需要的权限代码（留空自动生成）</p>
            <p>• 自动生成权限：开启后将自动创建该资源的完整CRUD权限</p>
            <p>• 排序：数字越小，菜单位置越靠前</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
