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

const EMPTY_USER_FORM = {
  username: '',
  email: '',
  password: '',
  real_name: '',
  phone: '',
  department_id: '',
  status: 'active',
  role_ids: [],
  access_level: 'SELF',
};

export function mapUserToForm(user) {
  if (!user) {
    return { ...EMPTY_USER_FORM, role_ids: [] };
  }

  return {
    username: user.username || '',
    email: user.email || '',
    password: '',
    real_name: user.real_name || '',
    phone: user.phone || '',
    department_id: user.department_id || '',
    status: user.status || 'active',
    role_ids: user.roles?.map((role) => role.id.toString()) || [],
    access_level: user.access_level || 'SELF',
  };
}

export function buildUserPayload(data, isEdit) {
  const submitData = { ...data };

  if (isEdit && !submitData.password) {
    delete submitData.password;
  }
  if (submitData.department_id === '') {
    submitData.department_id = null;
  }
  if (!submitData.role_ids) {
    submitData.role_ids = [];
  }

  return isEdit ? filterMaskedFields(submitData) : submitData;
}

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
    defaultValues: mapUserToForm(null),
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

  // 每次打开弹窗或切换当前用户时，恢复对应的初始值
  useEffect(() => {
    if (!open) return;
    reset(mapUserToForm(user));
  }, [open, user, reset]);

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
      const submitData = buildUserPayload(data, isEdit);

      if (isEdit) {
        await userApi.updateUser(user.id, submitData);
      } else {
        await userApi.createUser(submitData);
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
      <DialogContent
        overlayClassName="bg-black/35 backdrop-blur-[1px]"
        className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息与权限配置' : '创建用户并配置组织与权限'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section aria-labelledby="basic-user-fields">
              <h3 id="basic-user-fields" className="mb-4 text-sm font-semibold text-foreground">
                基本信息
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    用户名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    {...register('username')}
                    placeholder="请输入用户名"
                    disabled={isEdit}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>

                <SensitiveInput
                  name="email"
                  label="邮箱"
                  value={emailValue}
                  isEdit={isEdit}
                  required
                  type="email"
                  placeholder="请输入邮箱"
                  register={register}
                  setValue={setValue}
                  errors={errors}
                />

                <div className="space-y-2">
                  <Label htmlFor="password">
                    密码 {!isEdit && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder={isEdit ? '留空则不修改密码' : '请输入密码'}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

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
              </div>
            </section>

            <section aria-labelledby="user-access-fields">
              <h3 id="user-access-fields" className="mb-4 text-sm font-semibold text-foreground">
                组织与权限
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>所属部门</Label>
                  <Select
                    value={departmentIdValue || 'none'}
                    onValueChange={(value) =>
                      setValue('department_id', value === 'none' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {flattenDepartments(departments).map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {'　'.repeat(department.level)}{department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>数据查询权限</Label>
                  <Select
                    value={accessLevelValue}
                    onValueChange={(value) => setValue('access_level', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择数据查询权限" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELF">只能查看本人数据</SelectItem>
                      <SelectItem value="DEPARTMENT">可查看本部门及下级数据</SelectItem>
                      <SelectItem value="ALL">可查看所有数据</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>角色分配</Label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无可用角色</p>
                    ) : (
                      roles.map((role) => (
                        <div key={role.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            className="mt-0.5"
                            checked={roleIdsValue.includes(role.id.toString())}
                            onCheckedChange={(checked) =>
                              setValue(
                                'role_ids',
                                checked
                                  ? [...roleIdsValue, role.id.toString()]
                                  : roleIdsValue.filter((id) => id !== role.id.toString())
                              )
                            }
                          />
                          <div className="min-w-0">
                            <Label
                              htmlFor={`role-${role.id}`}
                              className="cursor-pointer font-normal"
                            >
                              {role.name}
                            </Label>
                            {role.description ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select
                    value={statusValue}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                      <SelectItem value="banned">封禁</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
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
