
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departmentApi, userApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { departmentSchema } from '@/lib/schemas';

export default function DepartmentFormDialog({ open, onOpenChange, department, onSuccess }) {
  const isEdit = !!department?.id;
  const [parentDepartments, setParentDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      leader_id: '',
      description: '',
      sort: 0,
      status: 'active',
    },
  });

  // 获取父级部门列表和用户列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取部门树
        const deptResponse = await departmentApi.getDepartmentTree();
        setParentDepartments(deptResponse.data || []);

        // 获取用户列表（用于选择负责人）- 获取多页以获取所有用户
        let allUsers = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) { // 最多获取10页，防止无限循环
          const userResponse = await userApi.getUsers({ page, limit: 100 });

          // 正确提取用户数组
          const responseData = userResponse.data?.data || userResponse.data;
          const userData = responseData?.items || responseData || [];

          if (Array.isArray(userData)) {
            allUsers = [...allUsers, ...userData];
          }

          // 检查是否还有更多数据
          const pagination = responseData?.pagination || userResponse.data?.pagination;
          hasMore = pagination && page < pagination.totalPages;
          page++;
        }

        setUsers(allUsers);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  // 当department变化时，更新表单
  useEffect(() => {
    if (department) {
      reset({
        name: department.name || '',
        code: department.code || '',
        leader_id: department.leader_id || '',
        description: department.description || '',
        sort: department.sort || 0,
        status: department.status || 'active',
      });
    } else {
      reset({
        name: '',
        code: '',
        leader_id: '',
        description: '',
        sort: 0,
        status: 'active',
      });
    }
  }, [department, reset]);

  const onSubmit = async (data) => {
    try {
      const submitData = {
        ...data,
        parent_id: department?.parent_id || null,
        code: data.code || null,
        leader_id: data.leader_id || null,
        description: data.description || null,
      };

      if (isEdit) {
        await departmentApi.updateDepartment(department.id, submitData);
      } else {
        await departmentApi.createDepartment(submitData);
      }

      toast.success(department && department.id ? '更新部门成功' : '创建部门成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存部门失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  const statusValue = watch('status');
  const leaderIdValue = watch('leader_id');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑部门' : '新增部门'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改部门信息' : '填写新部门信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 部门名称 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">
                部门名称 <span className="text-destructive">*</span>
              </Label>
              <Controller name={'name'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="name"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="请输入部门名称"
                />
              )} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 部门代码 */}
            <div className="space-y-2">
              <Label htmlFor="code">部门代码</Label>
              <Controller name={'code'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="code"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="如: IT_DEPT"
                />
              )} />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            {/* 负责人 */}
            <div className="space-y-2">
              <Label>负责人</Label>
              <Select
                value={leaderIdValue || 'none'}
                onValueChange={(value) => setValue('leader_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger className="!h-10">
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.real_name || user.username} ({user.email})
                    </SelectItem>
                  ))}
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
                <SelectTrigger className="!h-10">
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

            {/* 部门描述 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">部门描述</Label>
              <Controller name={'description'} control={control} render={({ field: controlledField }) => (
                <Textarea
                  id="description"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder="请输入部门描述"
                  rows={3}
                />
              )} />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* 说明文字 */}
          <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <p>• 部门名称：必填项，用于显示部门名称</p>
            <p>• 部门代码：可选，建议使用英文字母、数字、下划线或连字符组成的唯一标识</p>
            <p>• 负责人：可以指定部门负责人</p>
            <p>• 排序：数字越小，部门位置越靠前</p>
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
