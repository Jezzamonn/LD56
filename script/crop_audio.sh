#!/bin/bash

inputdir="$1"
outputdir="$2"

# Check if inputdir and outputdir are provided
if [ -z "$inputdir" ] || [ -z "$outputdir" ]; then
    echo "Usage: $0 <inputdir> <outputdir>"
    exit 1
fi

# Check if inputdir exists
if [ ! -d "$inputdir" ]; then
    echo "Input directory '$inputdir' does not exist"
    exit 1
fi

# Check if outputdir exists, if not create it
if [ ! -d "$outputdir" ]; then
    mkdir -p "$outputdir"
fi

# Loop through each mp3 file in inputdir
for file in "$inputdir"/*.mp3; do
    # Get the filename without the directory path
    filename=$(basename "$file")

    # Construct the output file path
    outfile="$outputdir/$filename"

    # Run ffmpeg command
    # TODO: This length should be different.
    ffmpeg -t 38.4 -i "$file" "$outfile"
done