#!/bin/bash

MUTTRC=/home/markham/proj/UC-Davis-Archery/365outlook/365muttrc

function run ()
{
	FIN="$1"
	TMPMUTT=$(mktemp)
	build "$FIN" "$TMPMUTT"
	bash "$TMPMUTT"
	rm "$TMPMUTT"
}

function build ()
{
	FIN="$1"
	TMPMUTT="$2"
	echo -n >"$TMPMUTT"
	while read -r line; do
		read -r quottoaddr quotbody < <(sed -e 's/^.* -- //' -e 's/ *<<< */\t/'  <<< "$line")
		name=$( grep -oP '(?<=Dear )[^,]+' <<< "$line"  )
		toaddr=${quottoaddr//\"/}
		body=${quotbody//\"/}
		>>"$TMPMUTT" echo "REPLYTO=ucdaggiearchery@ucdavis.edu mutt -F \"$MUTTRC\" -s 'Archery reservations for $name this week' -- \"$toaddr\" <<< \"$body\""
	done < <(extract "$FIN" | tr $'\n' ' ' | sed -e 's/ \+/ /g' -e 's/$/\n/' -e 's/REPLYTO/\nREPLYTO/g' )
}

function extract ()
{
	FIN="$1"
	is_in_txt_body=0
	while read -r line; do
		if (($is_in_txt_body)); then
			if [[ $line =~ Content-Type ]]; then
				break
			fi
			if [[ $line =~ REPLYTO ]]; then
				printf "\n"
			fi
			printf "$line "
		fi
		if [[ $line =~ Content-Type\:\ text/plain ]]; then
			is_in_txt_body=1
		fi
	done < "$FIN"
}

if [[ $BASH_SOURCE == $0 ]]; then

	TMP="$(mktemp)"
	whoami > "$TMP"
	echo $* >> "$TMP"
	date >> "$TMP"
	echo $@ >> "$TMP"
	echo > /tmp/tmp.txt

	THISDIR="$(dirname "$(readlink -f $0)")"

	while read -r line; do
		echo "$line" >> "$TMP"
		echo "$line" >> /tmp/tmp.txt
	done
	run "$TMP"

fi
