#!/bin/sh
set -eu

for file in js/*.js; do
    node --check "$file"
done

git diff --check
