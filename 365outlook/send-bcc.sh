#!/bin/bash

# Read list of email addresses from bcc.txt
# Read body of email from body.html
# Compose a single email with no 'TO' address
# Send email bcc-ing all listed addresses.

if (($#)); then
	subj="$1"
	bcc=()
	while read line; do
		if [[ -n $line ]]; then
			bcc=("${bcc[@]}" -b $line)
		fi
	done < bcc.txt
	if [[ -z bcc ]]; then
		>&2 echo need bcc for email
		exit 5
	fi
	body="$(tr -d '\n' < body.html)"
	if [[ -z $body ]]; then
		>&2 echo need body for email
		exit 6
	fi
	tr -d '\n' < body.html | REPLYTO=ucdaggiearchery@gmail.com mutt -F 365muttrc -s "$subj" "${bcc[@]}"
else
	>&2 echo need arg for email SUBJECT
	exit 7
fi
