#!/bin/sh

if [ -x $(command -v bun) ]; then
    RUNTIME=$(command -v bun)
elif [ -x $(command -v node) ]; then
    RUNTIME=$(command -v node)
else
    echo "No runtime found. Please install bun or node."
    exit 1
fi

$RUNTIME run build
cp styles.css build/styles.css
cp manifest.json build/manifest.json
cp src/postprocess.py build/postprocess.py