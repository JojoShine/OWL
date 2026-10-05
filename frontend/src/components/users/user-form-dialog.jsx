
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal, Select } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { Edit2 } from 'lucide-react';
import { userApi, departmentApi, roleApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { useSensitiveField } from '@/contexts/SensitiveFieldContext';
import { userSchema, filterMaskedFields } from '@/lib/schemas';

const EMPTY_USER_FORM = {
  username: '', email: '', password: '', real_name: '', phone: '',
  department_id: '', status: 'active', role_ids: [], access_level: 'SELF',
};

export function mapUserToForm(user) {
  if (!user) return { ...EMPTY_USER_FORM, role_ids: [] };
  return {
    username: user.username || '', email: user.email || '', password: '',
    real_name: user.real_name || '', phone: user.phone || '',
    department_id: user.department_id == null ? '' : String(user.department_id),
    status: user.status || 'active', role_ids: user.roles?.map((role) => String(role.id)) || [],
    access_level: user.access_level || 'SELF',
  };
}

export function buildUserPayload(data, isEdit) {
  const submitData = { ...data };
  if (isEdit && !submitData.password) delete submitData.password;
  if (submitData.department_id === '') submitData.department_id = null;
  if (!submitData.role_ids) submitData.role_ids = [];
  return isEdit ? filterMaskedFields(submitData) : submitData;
}

function departmentOptions(departments, level = 0) {
  return departments.flatMap((department) => [
    { value: String(department.id), label: `${'　'.repeat(level)}${department.name}` },
    ...departmentOptions(department.children || [], level + 1),
  ]);
}

export default function UserFormDialog({ open, onOpenChange, user, onSuccess }) {
  const [form] = Form.useForm();
  const { shouldShowEditButton } = useSensitiveField();
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [editable, setEditable] = useState({});
  const savingRef = useRef(false);
  const initialRef = useRef(mapUserToForm(user));
  const generation = useRef(0);
  const isEdit = !!user;

  useEffect(() => {
    if (!open) return;
    initialRef.current = mapUserToForm(user);
    form.resetFields();
    form.setFieldsValue(initialRef.current);
    setSaveError('');
    setDiscardOpen(false);
    setEditable({});
  }, [open, user, form]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLookupError('');
    Promise.all([departmentApi.getDepartmentTree(), roleApi.getRoles({ limit: 100 })])
      .then(([departmentResponse, roleResponse]) => {
        if (cancelled) return;
        const data = departmentResponse.data;
        setDepartments(Array.isArray(data) ? data : data?.items || []);
        setRoles(roleResponse.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setLookupError('组织与角色暂时无法加载，请关闭后重试。现有分配不会被更改。');
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    generation.current += 1;
    savingRef.current = false;
    setSaving(false);
    return () => { generation.current += 1; };
  }, [open, user]);

  const requestClose = () => {
    if (savingRef.current) return;
    const current = form.getFieldsValue(true);
    if (JSON.stringify(current) !== JSON.stringify(initialRef.current)) setDiscardOpen(true);
    else onOpenChange(false);
  };

  const submit = async (values) => {
    if (savingRef.current) return;
    const parsed = userSchema.safeParse(values);
    const fieldErrors = parsed.success ? [] : parsed.error.issues.map((issue) => ({ name: issue.path, errors: [issue.message] }));
    if (!isEdit && !values.password) fieldErrors.push({ name: ['password'], errors: ['密码是必填项'] });
    if (fieldErrors.length) {
      form.setFields(fieldErrors);
      form.scrollToField(fieldErrors[0].name, { focus: true });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    const currentGeneration = generation.current;
    try {
      const payload = buildUserPayload(parsed.data, isEdit);
      if (isEdit) await userApi.updateUser(user.id, payload);
      else await userApi.createUser(payload);
      if (currentGeneration !== generation.current) return;
      toast.success(isEdit ? '更新用户成功' : '创建用户成功');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      if (currentGeneration !== generation.current) return;
      setSaveError(error.response?.data?.message || error.message || '保存失败，请重试');
    } finally {
      if (currentGeneration === generation.current) { savingRef.current = false; setSaving(false); }
    }
  };

  const sensitiveField = (name, label, placeholder, required = false) => {
    const locked = isEdit && shouldShowEditButton(name, initialRef.current[name]) && !editable[name];
    return <div key={name} className="flex items-start gap-2">
      <Form.Item name={name} label={label} required={required} className="min-w-0 flex-1">
        <Input disabled={saving || locked} placeholder={locked ? '保持不变' : placeholder} />
      </Form.Item>
      {locked && <Button autoInsertSpace={false} className="mt-8" aria-label={`修改${label}`} icon={<Edit2 size={16} />} disabled={saving} onClick={() => {
        form.setFieldValue(name, '');
        setEditable((previous) => ({ ...previous, [name]: true }));
      }} />}
    </div>;
  };

  return <>
    <Modal
      open={open} onCancel={requestClose} footer={null} width={768} centered
      className="owl-user-modal" mask={{ closable: false }} keyboard={!saving}
      closable={!saving} forceRender
      title={<><span>{isEdit ? '编辑用户' : '新增用户'}</span><p className="mt-1 text-sm font-normal text-muted-foreground">{isEdit ? '修改用户信息与权限配置' : '创建用户并配置组织与权限'}</p></>}
    >
      <Form form={form} layout="vertical" onFinish={submit} initialValues={EMPTY_USER_FORM} requiredMark={false}
        onValuesChange={(changed) => form.setFields(Object.keys(changed).map((name) => ({ name, errors: [] })))}>
        <div className="owl-user-form-body">
          {saveError && <Alert type="error" showIcon title={saveError} role="alert" className="mb-4" />}
          {lookupError && <Alert type="warning" showIcon title={lookupError} role="alert" className="mb-4" />}
          <section aria-labelledby="basic-user-fields">
            <h3 id="basic-user-fields" className="mb-4 text-sm font-semibold text-foreground">基本信息</h3>
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="username" label="用户名" required><Input placeholder="请输入用户名" disabled={isEdit || saving} /></Form.Item>
              {sensitiveField('email', '邮箱', '请输入邮箱', true)}
              <Form.Item name="password" label="密码" required={!isEdit}><Input.Password autoComplete="new-password" placeholder={isEdit ? '留空则不修改密码' : '请输入密码'} disabled={saving} /></Form.Item>
              {sensitiveField('real_name', '真实姓名', '请输入真实姓名')}
              {sensitiveField('phone', '手机号', '请输入手机号（11位中国手机号）')}
            </div>
          </section>
          <section aria-labelledby="user-access-fields" className="mt-2">
            <h3 id="user-access-fields" className="mb-4 text-sm font-semibold text-foreground">组织与权限</h3>
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item name="department_id" label="所属部门"><Select disabled={saving || !!lookupError} options={[{ value: '', label: '无' }, ...departmentOptions(departments)]} /></Form.Item>
              <Form.Item name="access_level" label="数据查询权限"><Select disabled={saving} options={[{ value: 'SELF', label: '只能查看本人数据' }, { value: 'DEPARTMENT', label: '可查看本部门及下级数据' }, { value: 'ALL', label: '可查看所有数据' }]} /></Form.Item>
              <Form.Item name="role_ids" label="角色分配" className="md:col-span-2"
                getValueFromEvent={(selected) => [...new Set([
                  ...form.getFieldValue('role_ids').filter((id) => !roles.some((role) => String(role.id) === id)),
                  ...selected,
                ])]}>
                <Checkbox.Group className="owl-role-options" disabled={saving || !!lookupError}>
                  {roles.length === 0 ? <EmptyState title="暂无可用角色" compact /> : roles.map((role) => <Checkbox key={role.id} value={String(role.id)} className="owl-role-option" aria-label={role.name} aria-describedby={role.description ? `role-description-${role.id}` : undefined}>
                    <span className="owl-role-name">{role.name}</span>
                    {role.description && <span id={`role-description-${role.id}`} className="owl-role-description text-muted-foreground">{role.description}</span>}
                  </Checkbox>)}
                </Checkbox.Group>
              </Form.Item>
              <Form.Item name="status" label="状态"><Select disabled={saving} options={[{ value: 'active', label: '正常' }, { value: 'inactive', label: '禁用' }, { value: 'banned', label: '封禁' }]} /></Form.Item>
            </div>
          </section>
        </div>
        <div className="owl-user-form-footer"><Button autoInsertSpace={false} onClick={requestClose} disabled={saving}>取消</Button><Button autoInsertSpace={false} type="primary" htmlType="submit" loading={saving} disabled={saving}>{saving ? '保存中…' : '保存'}</Button></div>
      </Form>
    </Modal>
    <Modal open={discardOpen} title="放弃未保存的修改？" centered width={400} onCancel={() => setDiscardOpen(false)}
      footer={<><Button autoInsertSpace={false} onClick={() => setDiscardOpen(false)}>继续编辑</Button><Button autoInsertSpace={false} danger type="primary" onClick={() => { setDiscardOpen(false); onOpenChange(false); }}>放弃修改</Button></>}>
      <p>当前修改尚未保存，关闭后将丢失这些修改。</p>
    </Modal>
  </>;
}
