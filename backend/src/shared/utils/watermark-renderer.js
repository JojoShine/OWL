const VariableReplacementUtil = require('../watermark/variables');
class WatermarkRenderer {
async getRenderedWatermark(user) {
    try {
      const config = await this.getWatermarkConfig();

      if (!config.enabled) {
        return {
          ...config,
          lines: []
        };
      }

      // 替换lines中的变量
      const renderedLines = VariableReplacementUtil.renderLines(
        config.lines || [],
        user,
        config.masking_rules || {}
      );

      return {
        ...config,
        lines: renderedLines
      };
    } catch (error) {
      throw new Error(`渲染水印失败: ${error.message}`);
    }
  }

validateConfig(configData) {
    const errors = [];

    // 验证lines
    if (configData.lines) {
      const validation = VariableReplacementUtil.validateLines(configData.lines);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    // 验证fontSize
    if (configData.font_size) {
      const fontSize = parseInt(configData.font_size);
      if (fontSize < 12 || fontSize > 48) {
        errors.push('font_size must be between 12 and 48');
      }
    }

    // 验证fontWeight
    if (configData.font_weight) {
      const validWeights = [300, 400, 700];
      if (!validWeights.includes(parseInt(configData.font_weight))) {
        errors.push('font_weight must be one of: 300, 400, 700');
      }
    }

    // 验证color
    if (configData.color) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(configData.color)) {
        errors.push('color must be a valid hex color code (e.g., #000000)');
      }
    }

    // 验证opacity
    if (configData.opacity !== undefined) {
      const opacity = parseFloat(configData.opacity);
      if (opacity < 0.05 || opacity > 0.5) {
        errors.push('opacity must be between 0.05 and 0.5');
      }
    }

    // 验证rotation
    if (configData.rotation !== undefined) {
      const rotation = parseInt(configData.rotation);
      if (rotation < 0 || rotation > 360) {
        errors.push('rotation must be between 0 and 360');
      }
    }

    // 验证spacing
    if (configData.spacing) {
      const spacing = parseInt(configData.spacing);
      if (spacing < 50 || spacing > 300) {
        errors.push('spacing must be between 50 and 300');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

getDefaultConfig() {
    return {
      enabled: true,
      lines: [
        '账号: {{user:username|mask:hide:3}}',
        '部门: {{user:department}}',
        '姓名: {{user:realName}}'
      ],
      font_size: 24,
      font_weight: 400,
      color: '#000000',
      opacity: 0.15,
      rotation: 45,
      spacing: 150,
      masking_rules: {
        username: { type: 'hide', hideCount: 3 },
        email: { type: 'mask_middle', showCount: 2 },
        phone: { type: 'hide_last', hideCount: 4 }
      }
    };
  }
}
module.exports = WatermarkRenderer;
