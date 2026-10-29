export const passwordPolicyLabels = {
  basic: '至少 8 位', standard: '至少 10 位，包含两类字符', strict: '至少 12 位，包含三类字符',
};
export function validatePassword(password, policy) {
  const minimum = {basic:8,standard:10,strict:12}[policy];
  if (!minimum) return ['安全规则暂未加载，请稍后重试'];
  const errors = [];
  const length = [...password].length;
  if (length < minimum) errors.push(`密码至少 ${minimum} 位`);
  if (length > 50 || new TextEncoder().encode(password).length > 72) errors.push('密码最多 50 个字符，且不能超过 72 字节');
  const classes = [/[A-Z]/,/[a-z]/,/[0-9]/,/[^A-Za-z0-9\s]/u].filter(pattern=>pattern.test(password)).length;
  if (classes < {basic:0,standard:2,strict:3}[policy]) errors.push(passwordPolicyLabels[policy]+'（大写字母、小写字母、数字、其他非空白字符）');
  return errors;
}
