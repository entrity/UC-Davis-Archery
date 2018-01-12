#!/bin/bash
# This script was built to be used with mutt.
# Make sure you have a muttrc file
# -Markham (a.k.a. entrity)

# Example usage:
#  ./sendone.sh quinesrc Your\ Org mhanderson@ucdavis.edu

MUTTRC="$1"
ORG_NAME="$2"
ORG_NAME=$(sed -e "s/\&\#39\;/'/g" <<< "$ORG_NAME") # replace HTML char code for apostrophe
TO_ADDR="${@:3}"

# echo $MUTTRC
# echo "(Organization Name)/$ORG_NAME"
# echo TO_ADDR/${TO_ADDR[@]}

sed \
  -e "s/(Organization Name)/$ORG_NAME/g" \
  -e "s/TO_ADDR/${TO_ADDR[@]}/g" \
  draft-1.2.html | \
mutt \
-F "$MUTTRC" \
-e 'set content_type=text/html' \
-s 'Group Lesson with UC Davis Archery Team' \
-- $(sed "s/\t/,/g" <<< "${TO_ADDR[@]}")
