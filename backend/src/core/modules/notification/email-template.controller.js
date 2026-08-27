const emailTemplateService = require('./email-template.service');
const { success, paginated } = require('../../../utils/response');

class EmailTemplateController {
  /**
   * 获取邮件模板列表
   * GET /api/emails/templates
   */
  async getTemplates(req, res, next) {
    try {
      const result = await emailTemplateService.getAllTemplates(req.query);

      paginated(res, result.templates, {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      }, '获取模板列表成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取邮件模板详情
   * GET /api/emails/templates/:id
   */
  async getTemplateById(req, res, next) {
    try {
      const template = await emailTemplateService.getTemplateById(req.params.id);

      success(res, template, '获取模板详情成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建邮件模板
   * POST /api/emails/templates
   */
  async createTemplate(req, res, next) {
    try {
      const template = await emailTemplateService.createTemplate(req.body);

      success(res, template, '创建模板成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新邮件模板
   * PUT /api/emails/templates/:id
   */
  async updateTemplate(req, res, next) {
    try {
      const template = await emailTemplateService.updateTemplate(
        req.params.id,
        req.body
      );

      success(res, template, '更新模板成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除邮件模板
   * DELETE /api/emails/templates/:id
   */
  async deleteTemplate(req, res, next) {
    try {
      await emailTemplateService.deleteTemplate(req.params.id);

      success(res, null, '删除模板成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 预览邮件模板
   * POST /api/emails/templates/:id/preview
   */
  async previewTemplate(req, res, next) {
    try {
      const preview = await emailTemplateService.previewTemplate(
        req.params.id,
        {
          title: req.body.title,
          content: req.body.content,
        }
      );

      success(res, preview, '预览模板成功');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailTemplateController();
