#!/bin/bash

set -Eeo pipefail

if expr "$1" : "apache" 1>/dev/null || [ "$1" = "php-fpm" ]; then

    MONICADIR=/var/www/html
    ARTISAN="php ${MONICADIR}/artisan"

    # Ensure storage directories are present
    STORAGE=${MONICADIR}/storage
    mkdir -p ${STORAGE}/logs
    mkdir -p ${STORAGE}/app/public
    mkdir -p ${STORAGE}/framework/views
    mkdir -p ${STORAGE}/framework/cache
    mkdir -p ${STORAGE}/framework/sessions
    chown -R www-data:www-data ${STORAGE}
    chmod -R g+rw ${STORAGE}

    if [ -z "${APP_KEY:-}" -o "$APP_KEY" = "ChangeMeBy32KeyLengthOrGenerated" ]; then
        ${ARTISAN} key:generate --no-interaction
    else
        echo "APP_KEY already set"
    fi

    # Run migrations
    ${ARTISAN} waitfordb
    ${ARTISAN} monica:update --force -vv

    if [ ! -f "${STORAGE}/oauth-public.key" -o ! -f "${STORAGE}/oauth-private.key" ]; then
        echo "Passport keys creation ..."
        ${ARTISAN} passport:keys
        ${ARTISAN} passport:client --personal --no-interaction
        echo "! Please be careful to backup $MONICADIR/storage/oauth-public.key and $MONICADIR/storage/oauth-private.key files !"
    fi

fi

exec "$@"
