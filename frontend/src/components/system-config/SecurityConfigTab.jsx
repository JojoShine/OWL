import { useEffect, useState } from 'react';
import { Alert, Button, Form, Select } from 'antd';
import { systemConfigApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { passwordPolicyLabels } from '@/lib/schemas/password-policy';
export default function SecurityConfigTab({config,onUpdate}) {
  const [form] = Form.useForm();
  const [saving,setSaving] = useState(false);
  useEffect(()=>{ if(config) form.setFieldsValue({password_policy:config.password_policy,login_failure_limit:config.login_failure_limit,login_lock_minutes:config.login_lock_minutes}); },[config,form]);
  const save = async values => {
    setSaving(true);
    try {await systemConfigApi.updateConfig(values);toast.success('安全设置已保存');onUpdate?.();}
    catch(error){toast.requestError(error,'安全设置保存失败');}
    finally{setSaving(false);}
  };
  return <section className="mt-6 border-t pt-6" aria-labelledby="security-settings">
    <h2 id="security-settings" className="mb-2 text-lg font-semibold">安全设置</h2>
    <p className="mb-4 text-sm text-muted-foreground">密码规则用于创建和设置密码；已有密码仍可登录。</p>
    {!config ? <Alert type="warning" title="安全配置暂时无法加载，请刷新后重试" /> : <Form form={form} layout="vertical" onFinish={save} disabled={saving}>
      <Form.Item name="password_policy" label="密码强度" rules={[{required:true,message:'请选择密码强度'}]}>
        <Select options={Object.entries(passwordPolicyLabels).map(([value,label])=>({value,label:`${{basic:'基础',standard:'标准',strict:'严格'}[value]} · ${label}`}))}/>
      </Form.Item>
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item name="login_failure_limit" label="15 分钟内允许的密码失败次数" rules={[{required:true,message:'请选择失败次数'}]}><Select options={[3,5,10].map(value=>({value,label:`${value} 次`}))}/></Form.Item>
        <Form.Item name="login_lock_minutes" label="达到次数后的锁定时间" rules={[{required:true,message:'请选择锁定时间'}]}><Select options={[5,15,30].map(value=>({value,label:`${value} 分钟`}))}/></Form.Item>
      </div>
      <Button type="primary" htmlType="submit" loading={saving}>保存安全设置</Button>
    </Form>}
  </section>;
}
