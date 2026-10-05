const THIRD_PARTY_SCOPES = [
  { value: 'integration:ping', label: '接入连通性验证' },
  { value: 'user:sync', label: '用户数据同步' },
  { value: 'data:read', label: '业务数据读取' },
  { value: 'data:write', label: '业务数据写入' },
];

const THIRD_PARTY_SCOPE_VALUES = THIRD_PARTY_SCOPES.map((scope) => scope.value);

module.exports = { THIRD_PARTY_SCOPES, THIRD_PARTY_SCOPE_VALUES };
