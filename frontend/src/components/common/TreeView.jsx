
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronDown } from 'lucide-react';

/**
 * 树形视图组件 - 用于展示树形结构数据
 *
 * @param {Object} props
 * @param {Array} props.data - 树形数据
 * @param {Function} props.renderNode - 渲染节点内容的函数
 * @param {Function} props.onToggleExpand - 展开/收起回调
 * @param {Set} props.expandedIds - 已展开的节点ID集合
 * @param {number} props.level - 当前层级（内部使用）
 * @param {Function} props.getChildren - 获取子节点的函数，默认使用 children 属性
 */
export function TreeView({
  data = [],
  renderNode,
  onToggleExpand,
  expandedIds = new Set(),
  level = 0,
  getChildren = (node) => node.children || []
}) {
  return (
    <div>
      {data.map((node) => {
        const children = getChildren(node);
        const hasChildren = children && children.length > 0;
        const isExpanded = expandedIds.has(node.id);

        return (
          <div key={node.id}>
            <Card
              className="mb-2 hover:shadow-sm transition-shadow"
              style={{ marginLeft: `${level * 24}px` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* 展开/收起按钮 */}
                    {hasChildren ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onToggleExpand(node.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6" />
                    )}

                    {/* 节点内容 */}
                    {renderNode(node)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 递归渲染子节点 */}
            {hasChildren && isExpanded && (
              <TreeView
                data={children}
                renderNode={renderNode}
                onToggleExpand={onToggleExpand}
                expandedIds={expandedIds}
                level={level + 1}
                getChildren={getChildren}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
