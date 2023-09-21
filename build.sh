#!/bin/sh

if [ -x $(command -v bun) ]; then
    RUNTIME='bun'
elif [ -x $(command -v pnpm) ]; then
    RUNTIME='pnpm'
elif [ -x $(command -v yarn) ]; then
    RUNTIME='yarn'
elif [ -x $(command -v npm) ]; then
    RUNTIME='npm'
else
    echo "No runtime found. Please install either bun or node."
    exit 1
fi

$RUNTIME run build:typescript
cp styles.css build/styles.css
cp manifest.json build/manifest.json
cp src/postprocess.py build/postprocess.py