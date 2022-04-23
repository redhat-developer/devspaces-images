#!/bin/bash

# make a multi-layer favicon.ico via ImageMagick
# original source: https://gist.github.com/pfig/1808188

FILE=$1
EXT=`echo $1 | awk -F . '{print $NF}'`
BASE=`basename $FILE .$EXT`
shopt -s nocasematch

if [ -f $FILE ]; then
    case "$EXT" in 
        png )
            echo Creating $BASE.ico from $FILE...
        ;;
        *)
            echo Must input a png image, eg., favicon.png
            exit 1
        ;;
    esac
else
    echo no file $FILE
    exit 1
fi 

SIZES=""
# match the sizes of icons in the che favicon.ico
for SIZE in 64 32 24 16; do 
    convert -resize x$SIZE $FILE -background transparent $BASE-${SIZE}.png
    if [ "$SIZES" ]; then
        SIZES="$SIZES $BASE-$SIZE.png"
    else
        SIZES=$BASE-$SIZE.png
    fi
done
convert ${SIZES} -background transparent -colors 256 $BASE.ico
rm ${SIZES}
