const { body, query, validationResult } = require('express-validator');

/**
 * 水印配置验证规则
 */
const watermarkValidation = {
  /**
   * 获取水印配置验证
   */
  getWatermark: [
    // 无需验证
  ],

  /**
   * 获取渲染后的水印验证
   */
  getRenderedWatermark: [
    // 无需验证，使用当前登录用户信息
  ],

  /**
   * 更新水印配置验证
   */
  updateWatermark: [
    body('enabled')
      .optional()
      .isBoolean()
      .withMessage('enabled must be a boolean'),

    body('lines')
      .optional()
      .isArray()
      .withMessage('lines must be an array')
      .custom((value) => {
        if (value && !Array.isArray(value)) {
          throw new Error('lines must be an array');
        }
        if (value && value.length > 0) {
          value.forEach((line, index) => {
            if (typeof line !== 'string') {
              throw new Error(`Line ${index} must be a string`);
            }
          });
        }
        return true;
      }),

    body('font_size')
      .optional()
      .isInt({ min: 12, max: 48 })
      .withMessage('font_size must be between 12 and 48'),

    body('font_weight')
      .optional()
      .isIn([300, 400, 700])
      .withMessage('font_weight must be one of: 300, 400, 700'),

    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('color must be a valid hex color code (e.g., #000000)'),

    body('opacity')
      .optional()
      .isFloat({ min: 0.05, max: 0.5 })
      .withMessage('opacity must be between 0.05 and 0.5'),

    body('rotation')
      .optional()
      .isInt({ min: 0, max: 360 })
      .withMessage('rotation must be between 0 and 360'),

    body('spacing')
      .optional()
      .isInt({ min: 50, max: 300 })
      .withMessage('spacing must be between 50 and 300'),

    body('masking_rules')
      .optional()
      .isObject()
      .withMessage('masking_rules must be an object')
  ]
};

module.exports = watermarkValidation;