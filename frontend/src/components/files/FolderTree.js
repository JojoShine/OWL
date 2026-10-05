
import { useState } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  HomeIcon
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * 文件夹树节点组件
 */
function FolderTreeNode({ folder, level = 0, currentFolderId, onFolderClick }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = currentFolderId === folder.id;
  const isRoot = folder.id === null || folder.id === 'root';

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
    onFolderClick(folder.id);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div>
      {/* 文件夹节点 */}
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
          transition-colors
          ${isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-accent text-foreground'
          }
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* 展开/收起图标 */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-accent rounded"
          >
            {expanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* 文件夹图标 */}
        {isRoot ? (
          <HomeIcon className="w-4 h-4 flex-shrink-0" />
        ) : expanded ? (
          <FolderOpenIcon className="w-4 h-4 flex-shrink-0" />
        ) : (
          <FolderIcon className="w-4 h-4 flex-shrink-0" />
        )}

        {/* 文件夹名称 */}
        <span className="text-sm font-medium truncate flex-1">
          {folder.name || '我的文件'}
        </span>

        {/* 文件夹统计（可选） */}
        {folder.fileCount !== undefined && folder.fileCount > 0 && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {folder.fileCount}
          </span>
        )}
      </div>

      {/* 子文件夹 */}
      {expanded && hasChildren && (
        <div>
          {folder.children.map(child => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderClick={onFolderClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 文件夹树组件
 */
export default function FolderTree({
  folders = [],
  currentFolderId,
  onFolderClick,
  showRoot = true
}) {
  /**
   * 构建树形结构
   */
  const buildTree = (folders) => {
    if (!Array.isArray(folders) || folders.length === 0) {
      return [];
    }

    // 如果已经是树形结构（包含 children），直接返回
    if (folders[0]?.children !== undefined) {
      return folders;
    }

    // 否则，从扁平结构构建树
    const map = {};
    const roots = [];

    // 创建 ID 映射
    folders.forEach(folder => {
      map[folder.id] = { ...folder, children: [] };
    });

    // 构建树
    folders.forEach(folder => {
      const node = map[folder.id];
      if (folder.parent_id && map[folder.parent_id]) {
        map[folder.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree(folders);

  /**
   * 处理文件夹点击
   */
  const handleFolderClick = (folderId) => {
    onFolderClick?.(folderId);
  };

  /**
   * 处理根目录点击
   */
  const handleRootClick = () => {
    onFolderClick?.(null);
  };

  return (
    <div className="py-2">
      {/* 根目录 */}
      {showRoot && (
        <div
          onClick={handleRootClick}
          className={`
            flex items-center gap-2 px-2 py-1.5 mb-1 rounded-lg cursor-pointer
            transition-colors
            ${currentFolderId === null
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-accent text-foreground'
            }
          `}
        >
          <HomeIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">我的文件</span>
        </div>
      )}

      {/* 文件夹树 */}
      {tree.length > 0 ? (
        tree.map(folder => (
          <FolderTreeNode
            key={folder.id}
            folder={folder}
            level={0}
            currentFolderId={currentFolderId}
            onFolderClick={handleFolderClick}
          />
        ))
      ) : (
        <EmptyState icon={FolderIcon} title="暂无文件夹" compact className="px-2" />
      )}
    </div>
  );
}
