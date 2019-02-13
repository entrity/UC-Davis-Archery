#!/bin/bash
# This script was built to be used with mutt.
# Make sure you have a muttrc file
# -Markham (a.k.a. entrity)

# Example usage:
#  ./sendone.sh quinesrc Your\ Org mhanderson@ucdavis.edu

ORG_NAME="$1"
TO_ADDR="${@:2}"
ORG_NAME=$(sed -e "s/\&\#39\;/'/g" <<< "$ORG_NAME") # replace HTML char code for apostrophe
MUTTRC="../365outlook/365muttrc"
EMAILBODYFILE=draft-2.0.html

if [[ -z $ORG_NAME ]]; then
	>&2 echo FAIL need ORG_NAME
	exit 1
fi
if [[ -z $TO_ADDR ]]; then
	>&2 echo FAIL need TO_ADDR
	exit 1
fi
if ! [[ -e $MUTTRC ]]; then
	>&2 echo FAIL need MUTTRC $MUTTRC
	exit 1
fi
if ! [[ -e $EMAILBODYFILE ]]; then
	>&2 echo FAIL need EMAILBODYFILE $EMAILBODYFILE
	exit 1
fi

# echo $MUTTRC
# echo "(Organization Name)/$ORG_NAME"
# echo TO_ADDR/${TO_ADDR[@]}

sed \
  -e "s/(Organization Name)/$ORG_NAME/g" \
  -e "s/TO_ADDR/${TO_ADDR[@]}/g" \
  "$EMAILBODYFILE" | \
REPLYTO=ucdaggiearchery@gmail.com mutt \
-F "$MUTTRC" \
-e 'set content_type=text/html' \
-s 'Group Lesson with UC Davis Archery Team' \
-- $(sed "s/\t/,/g" <<< "${TO_ADDR[@]}")
