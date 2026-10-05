import axios from '../../utils/http-client';

export const watermarkApi = {
  // 获取水印配置（原始配置）
  getConfig: () => axios.get('/watermark'),

  // 获取渲染后的水印（替换用户变量）
  getRendered: () => axios.get('/watermark/rendered'),

  // 更新水印配置
  updateConfig: (data) => axios.put('/watermark', data),
};