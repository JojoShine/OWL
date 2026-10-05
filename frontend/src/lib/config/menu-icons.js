import * as LucideIcons from 'lucide-react';

// 默认图标
const { Menu } = LucideIcons;

/**
 * 根据名称动态获取图标组件
 * 支持所有 lucide-react 图标
 * @param {string} iconName - 图标名称（如 'Users', 'Home', 'Settings' 等）
 * @returns {React.Component} 图标组件，如果未找到则返回默认的 Menu 图标
 */
export function getMenuIcon(iconName) {
  if (!iconName) return Menu;

  // 尝试直接获取图标组件
  const IconComponent = LucideIcons[iconName];
  if (IconComponent) {
    return IconComponent;
  }

  // 处理特殊情况：MenuIcon 映射到 Menu
  if (iconName === 'MenuIcon') {
    return Menu;
  }

  // 默认返回 Menu 图标
  return Menu;
}

/**
 * 常用图标列表（用于图标选择器）
 */
export const commonIcons = [
  'LayoutDashboard',
  'Home',
  'Users',
  'UserCircle',
  'Shield',
  'Key',
  'Lock',
  'Settings',
  'Menu',
  'FolderOpen',
  'Folder',
  'FileText',
  'File',
  'Building2',
  'Activity',
  'BarChart3',
  'PieChart',
  'TrendingUp',
  'Network',
  'Bell',
  'Mail',
  'Inbox',
  'Send',
  'Code',
  'Database',
  'Server',
  'Cloud',
  'Package',
  'Box',
  'Archive',
  'Bookmark',
  'Calendar',
  'Clock',
  'Map',
  'MapPin',
  'Globe',
  'Search',
  'Filter',
  'Download',
  'Upload',
  'Trash2',
  'Edit',
  'Plus',
  'Minus',
  'Check',
  'X',
  'ChevronRight',
  'ChevronDown',
  'ChevronLeft',
  'ChevronUp',
  'AlertCircle',
  'AlertTriangle',
  'Info',
  'HelpCircle',
  'Star',
  'Heart',
  'Eye',
  'EyeOff',
  'Image',
  'Video',
  'Music',
  'Mic',
  'Phone',
  'MessageSquare',
  'MessageCircle',
  'Zap',
  'Target',
  'Award',
  'Gift',
  'Tag',
  'Layers',
  'Grid',
  'List',
  'MoreHorizontal',
  'MoreVertical',
];
