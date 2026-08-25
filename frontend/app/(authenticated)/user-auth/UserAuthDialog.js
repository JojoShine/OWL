'use client';

import { useState, useEffect } from 'react';
import { userAuthApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function UserAuthDialog({ open, onClose, user, onSuccess }) {
  const [formData, setFormData] = useState({
    user_name: '',
    phone: '',
    id_card: '',
    szks: '',
    xzzw: '',
    zj: '',
    zrpq: '',
    sffzr: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalZrpq, setOriginalZrpq] = useState(''); // 原始责任片区
  const [targetUsers, setTargetUsers] = useState([]); // 可选交接人列表
  const [targetUserId, setTargetUserId] = useState(''); // 选中的交接人
  const [isLoadingUsers, setIsLoadingUsers] = useState(false); // 加载交接人列表

  // 编辑时填充数据
  useEffect(() => {
    if (user) {
      const cleanedZrpq = (user.zrpq || '').trim();
      setOriginalZrpq(cleanedZrpq); // 保存原始责任片区
      setFormData({
        user_name: user.user_name || '',
        phone: user.phone || '',
        id_card: user.id_card || '',
        szks: user.szks || '',
        xzzw: user.xzzw || '',
        zj: user.zj || '',
        zrpq: cleanedZrpq,  // 清除空格
        sffzr: (user.sffzr || '').trim(),  // 清除空格
      });
      setTargetUsers([]); // 重置交接人列表
      setTargetUserId(''); // 重置选中的交接人
    } else {
      setOriginalZrpq('');
      setFormData({
        user_name: '',
        phone: '',
        id_card: '',
        szks: '',
        xzzw: '',
        zj: '',
        zrpq: '',
        sffzr: '',
      });
      setTargetUsers([]);
      setTargetUserId('');
    }
  }, [user, open]);

  // 监控责任片区变化，获取可交接人员列表
  useEffect(() => {
    const fetchTargetUsers = async () => {
      // 只在编辑模式下、且责任片区发生变化时才获取
      if (!user || !formData.zrpq || formData.zrpq === originalZrpq) {
        setTargetUsers([]);
        setTargetUserId('');
        return;
      }

      // 如果原来没有责任片区，不需要交接
      if (!originalZrpq) {
        setTargetUsers([]);
        setTargetUserId('');
        return;
      }

      try {
        setIsLoadingUsers(true);
        // 重要：获取原责任片区的其他人员，而不是新责任片区的人员
        const response = await userAuthApi.getUsersByZrpq(originalZrpq, user.user_id);
        setTargetUsers(response.data || []);

        // 如果有可选人员，自动选择第一个
        if (response.data && response.data.length > 0) {
          setTargetUserId(response.data[0].user_id);
        } else {
          setTargetUserId('');
        }
      } catch (error) {
        console.error('获取交接人员列表失败:', error);
        toast.error('获取交接人员列表失败');
        setTargetUsers([]);
        setTargetUserId('');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchTargetUsers();
  }, [formData.zrpq, originalZrpq, user]);

  // 表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.user_name) {
      toast.error('请输入用户姓名');
      return;
    }

    if (!formData.phone) {
      toast.error('请输入联系电话');
      return;
    }

    if (!formData.id_card) {
      toast.error('请输入身份证号');
      return;
    }

    try {
      setIsSubmitting(true);

      if (user) {
        // 编辑 - 如果责任片区发生变化，需要包含交接人ID
        const updateData = { ...formData };
        if (formData.zrpq !== originalZrpq && targetUserId) {
          updateData.target_user_id = targetUserId;
        }
        await userAuthApi.updateUserAuth(user.user_id, updateData);
        toast.success('更新核查人员成功');
      } else {
        // 新增
        await userAuthApi.createUserAuth(formData);
        toast.success('创建核查人员成功');
      }

      onSuccess();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 输入变化
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? '编辑核查人员' : '新增核查人员'}</DialogTitle>
          <DialogDescription>
            {user ? '修改核查人员信息。' : '填写核查人员信息，系统将自动生成用户ID。'}
            {user && user.zrpq && ' 注意：修改责任片区将自动转移该人员认领的企业。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 用户姓名 */}
            <div className="space-y-2">
              <Label htmlFor="user_name">
                用户姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user_name"
                value={formData.user_name}
                onChange={(e) => handleChange('user_name', e.target.value)}
                placeholder="请输入用户姓名"
                required
              />
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                联系电话 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="请输入联系电话"
                required
              />
            </div>

            {/* 身份证号 */}
            <div className="space-y-2">
              <Label htmlFor="id_card">
                身份证号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="id_card"
                value={formData.id_card}
                onChange={(e) => handleChange('id_card', e.target.value)}
                placeholder="请输入身份证号"
                maxLength={18}
                required
              />
            </div>

            {/* 所在科室 */}
            <div className="space-y-2">
              <Label htmlFor="szks">所在科室</Label>
              <Input
                id="szks"
                value={formData.szks}
                onChange={(e) => handleChange('szks', e.target.value)}
                placeholder="请输入所在科室"
              />
            </div>

            {/* 行政职务 */}
            <div className="space-y-2">
              <Label htmlFor="xzzw">行政职务</Label>
              <Input
                id="xzzw"
                value={formData.xzzw}
                onChange={(e) => handleChange('xzzw', e.target.value)}
                placeholder="请输入行政职务"
              />
            </div>

            {/* 职级 */}
            <div className="space-y-2">
              <Label htmlFor="zj">职级</Label>
              <Input
                id="zj"
                value={formData.zj}
                onChange={(e) => handleChange('zj', e.target.value)}
                placeholder="请输入职级"
              />
            </div>

            {/* 责任片区 */}
            <div className="space-y-2">
              <Label htmlFor="zrpq">责任片区(网格)</Label>
              <Select
                key={`zrpq-${user?.user_id || 'new'}`}
                value={formData.zrpq || 'none'}
                onValueChange={(value) => handleChange('zrpq', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="zrpq">
                  <SelectValue placeholder="请选择责任片区" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未设置</SelectItem>
                  <SelectItem value="第一责任区">第一责任区</SelectItem>
                  <SelectItem value="第二责任区">第二责任区</SelectItem>
                  <SelectItem value="第三责任区">第三责任区</SelectItem>
                  <SelectItem value="第四责任区">第四责任区</SelectItem>
                  <SelectItem value="第五责任区">第五责任区</SelectItem>
                  <SelectItem value="第六责任区">第六责任区</SelectItem>
                  <SelectItem value="第七责任区">第七责任区</SelectItem>
                  <SelectItem value="第八责任区">第八责任区</SelectItem>
                  <SelectItem value="第九责任区">第九责任区</SelectItem>
                  <SelectItem value="第十责任区">第十责任区</SelectItem>
                  <SelectItem value="第十一责任区">第十一责任区</SelectItem>
                  <SelectItem value="第十二责任区">第十二责任区</SelectItem>
                  <SelectItem value="第十三责任区">第十三责任区</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 是否负责人 */}
            <div className="space-y-2">
              <Label htmlFor="sffzr">是否负责人</Label>
              <Select
                value={formData.sffzr || 'none'}
                onValueChange={(value) => handleChange('sffzr', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="sffzr">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未设置</SelectItem>
                  <SelectItem value="是">是</SelectItem>
                  <SelectItem value="否">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 责任片区变化时显示交接人选择器 */}
          {user && formData.zrpq && formData.zrpq !== originalZrpq && (
            <div className="border-t pt-4 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  ⚠️ 责任片区已变更：{originalZrpq || '未设置'} → {formData.zrpq}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  请选择企业认领信息交接给哪位人员
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_user">
                  认领企业交接给 <span className="text-destructive">*</span>
                </Label>
                {isLoadingUsers ? (
                  <div className="text-sm text-muted-foreground py-2">加载人员列表中...</div>
                ) : targetUsers.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    该网格暂无其他人员，企业认领将设置为空
                  </div>
                ) : (
                  <Select
                    value={targetUserId}
                    onValueChange={setTargetUserId}
                  >
                    <SelectTrigger id="target_user">
                      <SelectValue placeholder="请选择交接人员" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetUsers.map((targetUser) => (
                        <SelectItem key={targetUser.user_id} value={targetUser.user_id}>
                          {targetUser.user_name} - {targetUser.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
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
