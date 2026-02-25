#!/bin/sh
set -e

if [ "${DB_ENGINE:-postgres}" = "postgres" ]; then
  echo "Waiting for PostgreSQL ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432} ..."
  until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}"; do
    sleep 1
  done
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
