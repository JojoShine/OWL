const handlebars = require('handlebars');
class EmailTemplateValidation {
ensureAllowedPlaceholders(subject, content) {
    const allowed = new Set(['title', 'content']);
    const templates = [subject, content];

    templates.forEach((tpl) => {
      const ast = handlebars.parse(tpl);
      this.walkTemplateAst(ast, allowed);
    });
  }

walkTemplateAst(node, allowed) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child) => this.walkTemplateAst(child, allowed));
      return;
    }

    if (node.type === 'MustacheStatement' || node.type === 'TripleStatement') {
      const name = node.path?.original;
      if (!allowed.has(name)) {
        throw new Error('邮件模板仅支持 {{title}} 和 {{content}} 变量');
      }
    }

    if (node.type === 'BlockStatement' || node.type === 'PartialStatement' || node.type === 'PartialBlockStatement') {
      throw new Error('邮件模板暂不支持条件、循环等高级语法');
    }

    Object.keys(node).forEach((key) => {
      if (['type', 'path', 'original'].includes(key)) {
        return;
      }
      const value = node[key];
      if (value && typeof value === 'object') {
        this.walkTemplateAst(value, allowed);
      }
    });
  }
}
module.exports = EmailTemplateValidation;
