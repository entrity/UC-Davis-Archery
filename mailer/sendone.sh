#!/bin/bash
# This script was built to be used with mutt.
# Make sure you have a muttrc file
# -Markham (a.k.a. entrity)

# Example usage:
#  ./sendone.sh quinesrc Your\ Org mhanderson@ucdavis.edu

MUTTRC="$1"
ORG_NAME="$2"
TO_ADDR="$3"

sed \
  -e "s/(Organization Name)/$ORG_NAME/g" \
  -e "s/TO_ADDR/$TO_ADDR/g" \
  draft-1.1.html | \
mutt \
-F "$MUTTRC" \
-e 'set content_type=text/html' \
-s 'Archery session from UC Davis' \
"$TO_ADDR"
echo $?
