
import { useWatermark } from '@/contexts/WatermarkContext';
import Watermark from '@/components/common/watermark/watermark';

export default function WatermarkRenderer() {
  const { config, isLoading } = useWatermark();

  if (isLoading) {
    return null;
  }

  // 确保 font_weight 是字符串
  const fontWeight = String(config.font_weight || '400');
  const lines = Array.isArray(config.lines) ? config.lines : [];

  return (
    <Watermark
      lines={lines}
      fontSize={Number(config.font_size) || 24}
      fontWeight={fontWeight}
      color={config.color || '#000000'}
      opacity={Number(config.opacity) || 0.1}
      rotation={Number(config.rotation) || 45}
      spacing={Number(config.spacing) || 150}
      enabled={Boolean(config.enabled)}
    />
  );
}
