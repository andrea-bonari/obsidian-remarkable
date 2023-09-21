#!/bin/sh

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
if [ -x "$(command -v flatpak-spawn)" ]; then
    # run myself with flatpak-spawn
    flatpak-spawn --host $SCRIPTPATH/runpostprocess.sh $@
else
    source $SCRIPTPATH/venv/bin/activate
    # join arguments with spaces

    POSTPROCESS_ARGS=""
    for arg in "$@"
    do
        POSTPROCESS_ARGS="$POSTPROCESS_ARGS $arg"
    done

    # run postprocess_example.py with arguments

    python3 $SCRIPTPATH/src/postprocess.py $POSTPROCESS_ARGS
fi