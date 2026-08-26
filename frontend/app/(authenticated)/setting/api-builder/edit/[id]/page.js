'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useParams } from 'next/navigation';
import { apiBuilderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Play, Wand2 } from 'lucide-react';
import { PageHeader, PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-dracula';
import { format as formatSql } from 'sql-formatter';

// 从SQL中提取参数（:paramName格式）
const extractSqlParameters = (sql) => {
  const matches = sql.match(/:(\w+)/g);
  if (!matches) return [];
  // 去重
  const unique = [...new Set(matches.map(m => m.substring(1)))];
  return unique;
};

export default function ApiBuilderEditPage() {
  const router = useRouter();
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const id = params.id;
  const isNewMode = id === 'new';

  // 根据系统主题选择编辑器主题
  // resolvedTheme: 'dark' | 'light' | undefined（初始化时）
  const editorTheme = resolvedTheme === 'dark' ? 'dracula' : 'textmate';

  const [isLoading, setIsLoading] = useState(!isNewMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint: '',
    method: 'GET',
    version: 1,
    sql_query: '',
    parameters: [],
    parameterValues: {}, // 参数值
    returnColumns: [], // 返回列信息
    require_auth: false,
    api_key_id: null, // 关联的API密钥ID
    rate_limit: 1000,
    status: 'active', // 默认状态
  });

  const [apiKeys, setApiKeys] = useState([]); // 可用的API密钥列表

  useEffect(() => {
    fetchApiKeys(); // 获取API密钥列表
    if (!isNewMode) {
      fetchInterface();
    }
  }, []);

  // 获取API密钥列表
  const fetchApiKeys = async () => {
    try {
      const response = await apiBuilderApi.getAllApiKeys();
      setApiKeys(response.data || []);
    } catch (error) {
      console.error('获取API密钥列表失败:', error);
    }
  };

  const fetchInterface = async () => {
    try {
      const response = await apiBuilderApi.getInterfaceById(id);
      const interfaceData = response.data || {};
      // 移除 /custom 前缀以便编辑
      if (interfaceData.endpoint?.startsWith('/custom')) {
        interfaceData.endpoint = interfaceData.endpoint.substring(7); // 移除 '/custom'
      }
      // 合并数据，确保所有字段都有值
      setFormData({
        name: interfaceData.name || '',
        description: interfaceData.description || '',
        endpoint: interfaceData.endpoint || '',
        method: interfaceData.method || 'GET',
        version: interfaceData.version || 1,
        sql_query: interfaceData.sql_query || '',
        parameters: interfaceData.parameters || [],
        parameterValues: interfaceData.parameterValues || {},
        returnColumns: interfaceData.returnColumns || [],
        require_auth: interfaceData.require_auth !== undefined ? interfaceData.require_auth : true,
        api_key_id: interfaceData.api_key_id || null,
        rate_limit: interfaceData.rate_limit || 1000,
        status: interfaceData.status || 'active',
      });
    } catch (error) {
      console.error('获取接口详情失败:', error);
      toast.error('获取接口详情失败');
      router.push('/setting/api-builder');
    } finally {
      setIsLoading(false);
    }
  };

  // 自动识别SQL中的参数
  const extractedParams = useMemo(() => {
    const paramNames = extractSqlParameters(formData.sql_query);
    return paramNames.map(name => ({
      name,
      type: 'string',
      required: true,
      description: '',
    }));
  }, [formData.sql_query]);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFormatSql = () => {
    if (!formData.sql_query.trim()) {
      toast.error('请输入SQL查询语句');
      return;
    }

    try {
      let sqlToFormat = formData.sql_query;
      const paramMap = {}; // 存储参数映射关系

      // 提取所有参数占位符
      const paramMatches = sqlToFormat.match(/:([\w]+)/g);

      if (paramMatches) {
        // 创建临时值映射，便于格式化后恢复
        paramMatches.forEach((match, index) => {
          const tempPlaceholder = `__PARAM_${index}__`;
          paramMap[tempPlaceholder] = match;
          // 用临时值替换参数（用字符串格式，这样格式化器能正确处理）
          sqlToFormat = sqlToFormat.replace(new RegExp(`\\${match}`, 'g'), `'${tempPlaceholder}'`);
        });
      }

      // 格式化SQL
      const formatted = formatSql(sqlToFormat, {
        language: 'postgresql',
        linesBetweenQueries: 2,
      });

      // 还原参数占位符
      let result = formatted;
      Object.entries(paramMap).forEach(([tempKey, originalParam]) => {
        // 恢复参数，移除引号
        result = result.replace(new RegExp(`'${tempKey}'`, 'g'), originalParam);
      });

      setFormData({ ...formData, sql_query: result });
      toast.success('SQL已格式化');
    } catch (error) {
      console.error('SQL格式化失败:', error);
      toast.error('SQL格式化失败：' + error.message);
    }
  };

  const handleTestSql = async () => {
    if (!formData.sql_query.trim()) {
      toast.error('请输入SQL查询语句');
      return;
    }

    // 验证所有必要参数都已填写
    const missingParams = extractedParams.filter(p => !formData.parameterValues[p.name]?.trim());
    if (missingParams.length > 0) {
      toast.error(`请填写以下参数: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    try {
      setIsTesting(true);
      setTestError(null);
      const response = await apiBuilderApi.testSql(formData.sql_query, formData.parameterValues);
      setTestResult(response.data);
      // 自动更新returnColumns
      if (response.data?.columns) {
        setFormData({
          ...formData,
          returnColumns: response.data.columns,
        });
      }
      toast.success('SQL测试成功');
    } catch (error) {
      console.error('SQL测试失败:', error);
      const errorMsg = error.response?.data?.message || 'SQL测试失败';
      setTestError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsTesting(false);
    }
  };

  const handleParameterValueChange = (paramName, value) => {
    setFormData({
      ...formData,
      parameterValues: {
        ...formData.parameterValues,
        [paramName]: value,
      },
    });
  };

  const handleReturnColumnChange = (index, field, value) => {
    const columns = [...(formData.returnColumns || [])];
    columns[index] = { ...columns[index], [field]: value };
    setFormData({ ...formData, returnColumns: columns });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入接口名称');
      return;
    }
    if (!formData.endpoint.trim()) {
      toast.error('请输入接口端点');
      return;
    }
    if (!formData.sql_query.trim()) {
      toast.error('请输入SQL查询');
      return;
    }

    try {
      setIsSaving(true);
      // 自动添加 /custom 前缀
      const endpoint = formData.endpoint.startsWith('/custom')
        ? formData.endpoint
        : `/custom${formData.endpoint.startsWith('/') ? formData.endpoint : '/' + formData.endpoint}`;

      const dataToSave = {
        ...formData,
        endpoint,
        parameters: extractedParams, // 使用自动识别的参数
      };

      if (isNewMode) {
        await apiBuilderApi.createInterface(dataToSave);
        toast.success('接口创建成功');
      } else {
        await apiBuilderApi.updateInterface(id, dataToSave);
        toast.success('接口更新成功');
      }

      router.push('/setting/api-builder');
    } catch (error) {
      console.error('保存接口失败:', error);
      toast.error(error.response?.data?.message || '保存接口失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <Loading size="lg" text="正在读取接口配置..." fullHeight />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* 页面头 */}
      <PageHeader
        title={isNewMode ? '新增接口' : '编辑接口'}
        description={isNewMode ? '创建一个新的 API 接口' : '修改 API 接口配置'}
        actions={(
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        )}
      />

      {/* 分步骤表单 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>接口配置</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.back()} disabled={isSaving}>
              取消
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList stretch>
              <TabsTrigger value="basic">1. 基本信息</TabsTrigger>
              <TabsTrigger value="sql">2. SQL查询</TabsTrigger>
              <TabsTrigger value="review">3. 确认保存</TabsTrigger>
            </TabsList>

            {/* 步骤1: 基本信息 */}
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">接口名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="例：用户查询"
                    className="mt-1 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base">接口端点 *</Label>
                  <Input
                    value={formData.endpoint}
                    onChange={(e) => handleFieldChange('endpoint', e.target.value)}
                    placeholder="例：/users/query"
                    className="mt-1 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">请求方式</Label>
                  <Select value={formData.method} onValueChange={(value) => handleFieldChange('method', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base">版本号</Label>
                  <Input
                    type="number"
                    value={formData.version}
                    onChange={(e) => handleFieldChange('version', parseInt(e.target.value))}
                    min="1"
                    className="mt-1 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">限流值（/小时）</Label>
                  <Input
                    type="number"
                    value={formData.rate_limit}
                    onChange={(e) => handleFieldChange('rate_limit', parseInt(e.target.value))}
                    min="1"
                    className="mt-1 text-base"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">接口描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="输入接口描述"
                  className="mt-1 min-h-20 text-base"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="require_auth"
                  checked={formData.require_auth}
                  onCheckedChange={(checked) => handleFieldChange('require_auth', checked)}
                />
                <Label htmlFor="require_auth" className="cursor-pointer text-base font-normal">
                  需要API密钥认证
                </Label>
              </div>

              {formData.require_auth && (
                <div>
                  <Label className="text-base">关联的API密钥</Label>
                  <Select
                    value={formData.api_key_id || 'none'}
                    onValueChange={(value) => handleFieldChange('api_key_id', value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue>
                        {formData.api_key_id ? (
                          (() => {
                            const selectedKey = apiKeys.find((k) => k.id === formData.api_key_id);
                            return selectedKey ? selectedKey.app_name : '密钥已删除';
                          })()
                        ) : (
                          '选择要关联的API密钥'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无（不关联密钥）</SelectItem>
                      {apiKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.app_name} ({key.id.substring(0, 8)}...)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {apiKeys.length === 0 && (
                    <EmptyState title="暂无可用的 API 密钥" description="请先在密钥管理中创建" compact />
                  )}
                </div>
              )}
            </TabsContent>

            {/* 步骤2: SQL查询 */}
            <TabsContent value="sql" className="space-y-4 mt-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-base">SQL语句 *</Label>
                    <p className="text-sm text-muted-foreground">支持 SELECT、INSERT、UPDATE、DELETE 操作，参数使用 :paramName 格式。禁止 DROP、TRUNCATE、ALTER 等危险操作。</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleFormatSql}
                      disabled={!formData.sql_query.trim()}
                      title="格式化SQL语句"
                    >
                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                      格式化
                    </Button>
                    <Button size="lg" onClick={handleTestSql} disabled={isTesting || !formData.sql_query.trim()}>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      {isTesting ? '测试中...' : '测试SQL'}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-md mt-1 overflow-hidden">
                  <AceEditor
                    mode="sql"
                    theme={editorTheme}
                    value={formData.sql_query}
                    onChange={(value) => handleFieldChange('sql_query', value)}
                    name="sql_query"
                    fontSize={14}
                    height="300px"
                    width="100%"
                    setOptions={{
                      useWorker: false,
                      showLineNumbers: true,
                      tabSize: 2,
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                    }}
                  />
                </div>

                {testError && (
                  <>
                    <div className="mt-4 border-t"></div>
                    <div className="mt-2 p-3 border rounded-md bg-red-50 dark:bg-red-950">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">测试失败：</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{testError}</p>
                    </div>
                  </>
                )}

                {extractedParams.length > 0 && (
                  <>
                    <div className="mt-4 border-t"></div>
                    <div className="mt-2 p-3 border rounded-md bg-muted/50">
                      <p className="mb-3 text-base font-semibold text-foreground">请求参数值：</p>
                      <div className="space-y-3">
                        {extractedParams.map((param) => (
                          <div key={param.name} className="grid grid-cols-2 gap-2">
                            <label className="flex items-center text-base text-foreground">
                              {param.name}
                              <span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                              type="text"
                              value={formData.parameterValues[param.name] || ''}
                              onChange={(e) => handleParameterValueChange(param.name, e.target.value)}
                              placeholder={`输入 ${param.name} 值`}
                              className="h-10 text-base"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {testResult && (
                  <>
                    <div className="mt-4 border-t"></div>
                    <div className="mt-2 p-3 border rounded-md bg-muted/50">
                      <p className="mb-3 text-sm font-semibold text-foreground">测试结果</p>

                      {testResult.operationType === 'SELECT' ? (
                        <>
                          <div className="mb-3 space-y-2 text-sm text-muted-foreground">
                            <p>总数据行数：<strong>{testResult.rowCount}</strong> | 显示：<strong>{Math.min(testResult.rowCount, 5)}</strong> 条</p>
                            <p>返回列数：<strong>{testResult.columns?.length || 0}</strong></p>
                          </div>

                          {/* 显示查询结果数据表格 */}
                          {Array.isArray(testResult.sample) && testResult.sample.length > 0 ? (
                            <div className="mt-3 overflow-x-auto" style={{ minHeight: '280px' }}>
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="bg-muted">
                                    {testResult.columns?.map((col) => (
                                      <th key={col.name} className="border px-3 py-3 text-left font-semibold text-foreground">
                                        {col.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {testResult.sample.map((row, idx) => (
                                    <tr key={idx} className="bg-card hover:bg-muted/60">
                                      {testResult.columns?.map((col) => (
                                        <td key={col.name} className="max-w-xs truncate border px-3 py-3 text-foreground">
                                          {String(row[col.name] ?? '-')}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="mt-3 min-h-[280px] rounded bg-card p-3">
                              <EmptyState title="暂无数据记录" compact className="min-h-[256px]" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                            <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-2">✓ {testResult.operationType} 操作成功</p>
                            <p className="text-sm text-green-700 dark:text-green-300">受影响行数：<strong>{testResult.affectedRows}</strong></p>
                            <p className="mt-2 text-sm text-green-700 dark:text-green-300">{testResult.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* 步骤3: 确认保存 */}
            <TabsContent value="review" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold text-base mb-3">接口摘要</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-sm">名称:</span>
                      <p className="font-medium">{formData.name || '未设置'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">端点:</span>
                      <p className="font-mono font-medium text-sm">
                        {(() => {
                          const endpoint = formData.endpoint || '未设置';
                          if (endpoint === '未设置') return endpoint;
                          return formData.endpoint.startsWith('/custom')
                            ? formData.endpoint
                            : `/custom${formData.endpoint.startsWith('/') ? formData.endpoint : '/' + formData.endpoint}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">请求方式:</span>
                      <p className="font-medium text-sm">{formData.method}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">版本:</span>
                      <p className="font-medium">V{formData.version}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-sm">描述:</span>
                      <p className="font-medium text-sm">{formData.description || '无'}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold text-base mb-2">SQL查询</h3>
                  <pre className="bg-background p-2 rounded border text-sm overflow-x-auto max-h-32">
                    {formData.sql_query || '未设置'}
                  </pre>
                </div>

                {extractedParams.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold text-base mb-3">请求参数</h3>
                    <div className="space-y-2">
                      {extractedParams.map((param) => (
                        <div key={param.name} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{param.name}</span>
                          <span className="text-muted-foreground text-sm">必需 • {param.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageShell>
  );
}
