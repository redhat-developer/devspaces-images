#!/bin/sh

staged=$(git diff --cached --name-only --diff-filter=ACMR "*.ts" "*.tsx" | sed 's| |\\ |g')

if [ -z "$staged" ]; then
  exit 0
fi

yarn test --passWithNoTests --findRelatedTests $(echo $staged)

exit 0
