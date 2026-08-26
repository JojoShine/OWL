'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { RefreshCwIcon, PlusCircleIcon } from 'lucide-react';

export default function TablesSection({
  tables,
  loading,
  searchTerm,
  onSearchChange,
  onRefresh,
  onInitialize,
  onCheckAudit,
  pagination,
  onPageChange,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>数据库表列表</CardTitle>
        <CardDescription>
          选择表来初始化模块配置
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索栏 */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="搜索表名..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0">
              <Button onClick={onRefresh} variant="outline" size="lg">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>表名</TableHead>
                <TableHead>注释</TableHead>
                <TableHead>字段数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.tableName} className="h-12 hover:bg-muted/30">
                    <TableCell className="font-mono">{table.tableName}</TableCell>
                    <TableCell>{table.comment || '-'}</TableCell>
                    <TableCell>{table.columnCount}</TableCell>
                    <TableCell>
                      {table.isGenerated ? (
                        <Badge variant="secondary">已生成</Badge>
                      ) : (
                        <Badge variant="outline">未生成</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* owl_ 开头的系统表或审计字段已完整时不显示补全按钮 */}
                        {!table.tableName.startsWith('owl_') && !table.auditFieldsComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCheckAudit(table.tableName)}
                            disabled={loading}
                          >
                            <PlusCircleIcon className="w-4 h-4 mr-1" />
                            补全审计字段
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => onInitialize(table.tableName)}
                          disabled={table.isGenerated || loading}
                        >
                          初始化配置
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.total > 0 && (
          <Pagination
            page={pagination.page}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
