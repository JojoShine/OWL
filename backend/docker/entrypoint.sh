#!/bin/sh
set -eu

load_secret() {
  variable_name="$1"
  file_variable_name="${variable_name}_FILE"
  eval "secret_file=\${${file_variable_name}:-}"

  if [ -z "${secret_file}" ]; then
    return
  fi

  if [ ! -r "${secret_file}" ]; then
    echo "Secret file is not readable: ${secret_file}" >&2
    exit 1
  fi

  secret_value="$(cat "${secret_file}")"
  export "${variable_name}=${secret_value}"
  unset secret_value
}

for variable_name in \
  DB_PASSWORD \
  REDIS_PASSWORD \
  JWT_SECRET \
  JWT_REFRESH_SECRET \
  MINIO_ACCESS_KEY \
  MINIO_SECRET_KEY \
  THIRD_PARTY_SECRET_ENCRYPTION_KEY \
  API_KEY_PEPPER
do
  load_secret "${variable_name}"
done

exec "$@"
