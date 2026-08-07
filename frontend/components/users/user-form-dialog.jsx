'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { userApi, departmentApi, roleApi } from '@/lib/api';
import { toast } from 'sonner';
import { SensitiveInput } from '@/components/form/SensitiveInput';
import { userSchema, filterMaskedFields } from '@/lib/schemas';

export default function UserFormDialog({ open, onOpenChange, user, onSuccess }) {
  const isEdit = !!user;
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      real_name: '',
      phone: '',
      department_id: '',
      status: 'active',
      role_ids: [],
      access_level: 'SELF',
    },
  });

  // 获取部门列表和角色列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getDepartmentTree();
        // 处理多种可能的返回格式
        const deptData = response.data?.items || response.data || [];
        setDepartments(Array.isArray(deptData) ? deptData : []);
      } catch (error) {
        console.error('获取部门列表失败:', error);
        setDepartments([]);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await roleApi.getRoles({ limit: 100 });
        // 处理多种可能的返回格式
        const roleData = response.data?.items || response.data || [];
        setRoles(Array.isArray(roleData) ? roleData : []);
      } catch (error) {
        console.error('获取角色列表失败:', error);
        setRoles([]);
      }
    };

    if (open) {
      fetchDepartments();
      fetchRoles();
    }
  }, [open]);

  // 当user变化或弹窗打开/关闭时，更新表单
  useEffect(() => {
    if (user) {
      // 提取用户的角色ID列表
      const userRoleIds = user.roles?.map(role => role.id.toString()) || [];

      reset({
        username: user.username || '',
        email: user.email || '',
        password: '',
        real_name: user.real_name || '',
        phone: user.phone || '',
        department_id: user.department_id || '',
        status: user.status || 'active',
        role_ids: userRoleIds,
        access_level: user.access_level || 'SELF',
      });
    } else {
      reset({
        username: '',
        email: '',
        password: '',
        real_name: '',
        phone: '',
        department_id: '',
        status: 'active',
        role_ids: [],
        access_level: 'SELF',
      });
    }
  }, [user, reset]);

  // 将部门树展平为列表（用于下拉选择）
  const flattenDepartments = (deptList, level = 0) => {
    let result = [];
    deptList.forEach(dept => {
      result.push({ ...dept, level });
      if (dept.children && dept.children.length > 0) {
        result = result.concat(flattenDepartments(dept.children, level + 1));
      }
    });
    return result;
  };

  const onSubmit = async (data) => {
    try {
      // 如果是编辑且密码为空，则不传递密码字段
      const submitData = { ...data };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }
      // 如果 department_id 为空字符串，转换为 null
      if (submitData.department_id === '') {
        submitData.department_id = null;
      }
      // role_ids 保持为字符串数组（不转换为数字）
      if (!submitData.role_ids || submitData.role_ids.length === 0) {
        submitData.role_ids = [];
      }

      // 移除所有包含脱敏标记的字段（编辑模式下）
      const finalData = isEdit ? filterMaskedFields(submitData) : submitData;

      if (isEdit) {
        await userApi.updateUser(user.id, finalData);
      } else {
        await userApi.createUser(finalData);
      }

      toast.success(user ? '更新用户成功' : '创建用户成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存用户失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  const statusValue = watch('status');
  const departmentIdValue = watch('department_id');
  const accessLevelValue = watch('access_level');
  const emailValue = watch('email');
  const phoneValue = watch('phone');
  const realNameValue = watch('real_name');
  const roleIdsValue = watch('role_ids') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息' : '填写新用户信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">
              用户名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              {...register('username')}
              placeholder="请输入用户名"
              disabled={isEdit}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* 邮箱 */}
          <SensitiveInput
            name="email"
            label="邮箱"
            value={emailValue}
            isEdit={isEdit}
            required={true}
            type="email"
            placeholder="请输入邮箱"
            register={register}
            setValue={setValue}
            errors={errors}
          />

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              密码 {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="text-muted-foreground text-xs">（留空则不修改）</span>}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={isEdit ? '留空则不修改密码' : '请输入密码'}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* 真实姓名 */}
          <SensitiveInput
            name="real_name"
            label="真实姓名"
            value={realNameValue}
            isEdit={isEdit}
            placeholder="请输入真实姓名"
            register={register}
            setValue={setValue}
            errors={errors}
          />

          {/* 手机号 */}
          <SensitiveInput
            name="phone"
            label="手机号"
            value={phoneValue}
            isEdit={isEdit}
            placeholder="请输入手机号（11位中国手机号）"
            register={register}
            setValue={setValue}
            errors={errors}
          />

          {/* 所属部门 */}
          <div className="space-y-2">
            <Label>所属部门</Label>
            <Select
              value={departmentIdValue || 'none'}
              onValueChange={(value) => setValue('department_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="!h-10">
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无</SelectItem>
                {flattenDepartments(departments).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {'　'.repeat(dept.level)}{dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 数据查询权限 */}
          <div className="space-y-2">
            <Label>数据查询权限</Label>
            <Select
              value={accessLevelValue}
              onValueChange={(value) => setValue('access_level', value)}
            >
              <SelectTrigger className="!h-10">
                <SelectValue placeholder="选择数据查询权限" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SELF">只能查看本人数据</SelectItem>
                <SelectItem value="DEPARTMENT">可查看本部门及下级数据</SelectItem>
                <SelectItem value="ALL">可查看所有数据</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 角色分配 */}
          <div className="space-y-2">
            <Label>角色分配</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可用角色</p>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={roleIdsValue.includes(role.id.toString())}
                      onCheckedChange={(checked) => {
                        const newRoleIds = checked
                          ? [...roleIdsValue, role.id.toString()]
                          : roleIdsValue.filter((id) => id !== role.id.toString());
                        setValue('role_ids', newRoleIds);
                      }}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground ml-2">
                          ({role.description})
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
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
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
                <SelectItem value="banned">封禁</SelectItem>
              </SelectContent>
            </Select>
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
