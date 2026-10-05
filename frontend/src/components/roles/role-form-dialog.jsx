
import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { roleApi, permissionApi, menuApi } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { roleSchema } from '@/lib/schemas';

export default function RoleFormDialog({ open, onOpenChange, role, onSuccess }) {
  const isEdit = !!role;
  const [permissions, setPermissions] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
      sort: 0,
    },
  });

  // 获取所有权限
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await permissionApi.getAllPermissions();
        // response.data.items 可能是对象（已分组）或数组
        const permissionsData = response.data?.items || [];
        setPermissions(permissionsData);
      } catch (error) {
        console.error('获取权限列表失败:', error);
      }
    };
    if (open) {
      fetchPermissions();
    }
  }, [open]);

  // 获取所有菜单
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await menuApi.getMenuTree();
        // response.data.items 是数组
        const menusData = response.data?.items || [];
        setMenus(Array.isArray(menusData) ? menusData : []);
      } catch (error) {
        console.error('获取菜单列表失败:', error);
      }
    };
    if (open) {
      fetchMenus();
    }
  }, [open]);

  // 当role变化时，更新表单
  useEffect(() => {
    const fetchRoleDetail = async () => {
      if (role && open) {
        setIsLoadingData(true);
        try {
          // 调用详情接口获取完整数据（包含权限和菜单）
          const response = await roleApi.getRole(role.id);
          const roleDetail = response.data;

          reset({
            name: roleDetail.name || '',
            code: roleDetail.code || '',
            description: roleDetail.description || '',
            status: roleDetail.status || 'active',
            sort: roleDetail.sort || 0,
          });
          // 设置已选择的权限和菜单
          setSelectedPermissions(roleDetail.permissions?.map(p => p.id) || []);
          setSelectedMenus(roleDetail.menus?.map(m => m.id) || []);
        } catch (error) {
          console.error('获取角色详情失败:', error);
          toast.error('获取角色详情失败');
          // 如果获取失败，使用列表数据
          reset({
            name: role.name || '',
            code: role.code || '',
            description: role.description || '',
            status: role.status || 'active',
            sort: role.sort || 0,
          });
          setSelectedPermissions([]);
          setSelectedMenus([]);
        } finally {
          setIsLoadingData(false);
        }
      } else if (!role) {
        reset({
          name: '',
          code: '',
          description: '',
          status: 'active',
          sort: 0,
        });
        setSelectedPermissions([]);
        setSelectedMenus([]);
      }
    };

    fetchRoleDetail();
  }, [role, open, reset]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        permission_ids: selectedPermissions,
        menu_ids: selectedMenus,
      };

      if (isEdit) {
        await roleApi.updateRole(role.id, submitData);
      } else {
        await roleApi.createRole(submitData);
      }

      toast.success(role ? '更新角色成功' : '创建角色成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存角色失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  const statusValue = watch('status');

  // 权限选择处理
  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // 菜单选择处理
  const handleMenuChange = (menuId) => {
    setSelectedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 渲染菜单树
  const renderMenuTree = (menuList, level = 0) => {
    return menuList.map((menu) => (
      <div key={menu.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id={`menu-${menu.id}`}
            checked={selectedMenus.includes(menu.id)}
            onCheckedChange={() => handleMenuChange(menu.id)}
          />
          <label
            htmlFor={`menu-${menu.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {menu.name} {menu.path && <span className="text-muted-foreground text-xs">({menu.path})</span>}
          </label>
        </div>
        {menu.children && menu.children.length > 0 && renderMenuTree(menu.children, level + 1)}
      </div>
    ));
  };

  // 按category分组权限
  // permissions 可能已经是对象（已分组）或者是数组（需要分组）
  const groupedPermissions = Array.isArray(permissions)
    ? permissions.reduce((acc, permission) => {
        const category = permission.category || '其他';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      }, {})
    : permissions; // 如果已经是对象，直接使用

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息、权限和菜单' : '填写新角色信息并分配权限和菜单'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <Loading size="md" variant="spinner" text="加载角色数据..." />
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList stretch>
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="permissions">权限配置</TabsTrigger>
              <TabsTrigger value="menus">菜单配置</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* 角色名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  角色名称 <span className="text-destructive">*</span>
                </Label>
                <Controller name={'name'} control={control} render={({ field: controlledField }) => (
                  <Input
                    id="name"
                    {...controlledField} value={controlledField.value ?? ""}
                    placeholder="请输入角色名称"
                  />
                )} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* 角色代码 */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  角色代码 <span className="text-destructive">*</span>
                </Label>
                <Controller name={'code'} control={control} render={({ field: controlledField }) => (
                  <Input
                    id="code"
                    {...controlledField} value={controlledField.value ?? ""}
                    placeholder="请输入角色代码（英文）"
                    disabled={isEdit}
                  />
                )} />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>

              {/* 描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Controller name={'description'} control={control} render={({ field: controlledField }) => (
                  <Input
                    id="description"
                    {...controlledField} value={controlledField.value ?? ""}
                    placeholder="请输入角色描述"
                  />
                )} />
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
            </TabsContent>

            {/* 权限配置 */}
            <TabsContent value="permissions" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <EmptyState title="暂无权限" compact />
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium text-sm text-primary">{category}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionChange(permission.id)}
                              />
                              <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permission.name}
                                <span className="text-muted-foreground text-xs ml-1">
                                  ({permission.code})
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* 菜单配置 */}
            <TabsContent value="menus" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {menus.length === 0 ? (
                  <EmptyState title="暂无菜单" compact />
                ) : (
                  <div className="space-y-2">
                    {renderMenuTree(menus)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

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
        )}
      </DialogContent>
    </Dialog>
  );
}
