
import { useState, useEffect } from 'react';
import { watermarkApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { Loader, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';

export default function WatermarkSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    lines: [],
    font_size: 24,
    font_weight: '400',
    color: '#000000',
    opacity: 0.1,
    rotation: 45,
    spacing: 150,
  });
  const [preview, setPreview] = useState('');

  // 获取配置
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await watermarkApi.getConfig();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      toast.error('加载配置失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取预览
  const fetchPreview = async () => {
    try {
      const response = await watermarkApi.getRendered();
      if (response.data) {
        setPreview(response.data.lines?.join('\\n') || '');
      }
    } catch (error) {
      console.error('获取预览失败:', error);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  // 更新配置
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await watermarkApi.updateConfig(config);
      toast.success('配置已保存');
      fetchPreview();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 处理行文本变化
  const handleLineChange = (index, value) => {
    const newLines = [...config.lines];
    newLines[index] = value;
    setConfig({ ...config, lines: newLines });
  };

  // 添加新行
  const handleAddLine = () => {
    setConfig({
      ...config,
      lines: [...config.lines, '']
    });
  };

  // 删除行
  const handleRemoveLine = (index) => {
    const newLines = config.lines.filter((_, i) => i !== index);
    setConfig({ ...config, lines: newLines });
  };

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader
          title="水印设置"
          description="配置水印内容、显示样式并预览浅色与深色背景效果。"
        />
        <PageSurface className="flex min-h-48 items-center justify-center p-5">
          <Loader className="h-8 w-8 animate-spin" />
        </PageSurface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="水印设置"
        description="配置水印内容、显示样式并预览浅色与深色背景效果。"
      />
      <div className="grid auto-rows-max gap-5 lg:grid-cols-2">
      {/* 配置表单 */}
      <div className="flex">
        <Card className="w-full">
            <CardHeader>
              <CardTitle>配置</CardTitle>
              <CardDescription>编辑水印参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 启用状态 */}
              <div className="space-y-2">
                <Label>启用水印</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                  <span className="text-sm text-muted-foreground">{config.enabled ? '已启用' : '已禁用'}</span>
                </div>
              </div>

              {/* 文字大小 */}
              <div className="space-y-2">
                <Label>文字大小 (px)</Label>
                <Input
                  type="number"
                  min="12"
                  max="48"
                  value={config.font_size}
                  onChange={(e) => setConfig({ ...config, font_size: parseInt(e.target.value) })}
                />
              </div>

              {/* 字体粗细 */}
              <div className="space-y-2">
                <Label>字体粗细</Label>
                <Select value={String(config.font_weight) || '400'} onValueChange={(value) => setConfig({ ...config, font_weight: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择字体粗细" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">轻 (300)</SelectItem>
                    <SelectItem value="400">正常 (400)</SelectItem>
                    <SelectItem value="700">加粗 (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 颜色 */}
              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 透明度 */}
              <div className="space-y-2">
                <Label>透明度</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    value={[config.opacity]}
                    onValueChange={(value) => setConfig({ ...config, opacity: value[0] })}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{(config.opacity * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* 旋转角度 */}
              <div className="space-y-2">
                <Label>旋转角度 (度)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[config.rotation]}
                    onValueChange={(value) => setConfig({ ...config, rotation: value[0] })}
                    className="flex-1"
                  />
                  <span className="text-sm w-12 text-right">{config.rotation}°</span>
                </div>
              </div>

              {/* 间距 */}
              <div className="space-y-2">
                <Label>间距 (px)</Label>
                <Input
                  type="number"
                  min="50"
                  max="300"
                  value={config.spacing}
                  onChange={(e) => setConfig({ ...config, spacing: parseInt(e.target.value) })}
                />
              </div>

              {/* 保存按钮 */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-6"
              >
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
            </CardContent>
          </Card>
      </div>

      {/* 水印行配置和预览 */}
      <div className="space-y-5">
        {/* 行配置 */}
        <Card>
            <CardHeader>
              <CardTitle>水印内容</CardTitle>
              <CardDescription>配置水印显示的内容和用户变量</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">水印行</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="查看水印变量说明"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm mb-2">支持的用户变量：</p>
                        <ul className="space-y-1 text-xs">
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:username}}'}</code> - 账号</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:realName}}'}</code> - 真实姓名</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:department}}'}</code> - 部门</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:email}}'}</code> - 邮箱</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:phone}}'}</code> - 电话</li>
                        </ul>
                      </div>
                      <div className="border-t pt-2">
                        <p className="font-medium text-sm mb-2">脱敏示例：</p>
                        <ul className="space-y-1 text-xs">
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:username|mask:hide:3}}'}</code> - 隐藏前3个字符</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:phone|mask:mask_middle:2}}'}</code> - 显示首尾各2个字符</li>
                          <li><code className="rounded bg-muted px-1.5 py-0.5">{'{{user:email|mask:hide_last:4}}'}</code> - 隐藏后4个字符</li>
                        </ul>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 输入行 */}
              {config.lines.map((line, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`第 ${index + 1} 行`}
                    value={line}
                    onChange={(e) => handleLineChange(index, e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveLine(index)}
                  >
                    删除
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={handleAddLine}
                className="w-full"
              >
                + 添加行
              </Button>
            </CardContent>
          </Card>

          {/* 预览 */}
          <Card>
            <CardHeader>
              <CardTitle>预览</CardTitle>
              <CardDescription>水印渲染效果预览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 浅色模式预览 */}
                <div>
                  <p className="text-sm font-medium mb-2">浅色模式预览</p>
                  <div
                    className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e3e5e8' }}
                  >
                    <div
                      style={{
                        fontSize: `${config.font_size}px`,
                        fontWeight: config.font_weight,
                        color: config.color === '#ffffff' ? '#000000' : config.color,
                        opacity: config.opacity,
                        transform: `rotate(${config.rotation}deg)`,
                        whiteSpace: 'pre-line',
                        textAlign: 'center',
                      }}
                    >
                      {preview || '水印预览'}
                    </div>
                  </div>
                </div>

                {/* 暗黑模式预览 */}
                <div>
                  <p className="text-sm font-medium mb-2">暗黑模式预览</p>
                  <div
                    className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border"
                    style={{ backgroundColor: '#17191d', borderColor: '#34383f' }}
                  >
                    <div
                      style={{
                        fontSize: `${config.font_size}px`,
                        fontWeight: config.font_weight,
                        color: config.color === '#000000' ? '#ffffff' : config.color,
                        opacity: config.opacity,
                        transform: `rotate(${config.rotation}deg)`,
                        whiteSpace: 'pre-line',
                        textAlign: 'center',
                      }}
                    >
                      {preview || '水印预览'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      </div>
    </PageShell>
  );
}
