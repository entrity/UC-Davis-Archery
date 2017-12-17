#!/bin/bash

LOG=sent.tsv
touch "$LOG"
diff -w "$LOG" email-addresses.tsv \
| grep -P '^>' \
| perl -pe 's/^> //' \
| while read -r line; do
	name="$(cut -f1 <<< "$line")"
	home="$(cut -f2 <<< "$line")"
	IFS=$'\t' read -r -a addrs < <(cut -f3- <<< "$line")
	printf "\n$name\t$home"  >> "$LOG"
	for addr in "${addrs[@]}"; do
		if ./sendone.sh aggierc "$name" "$addr"; then
			printf "\t$addr" >> "$LOG"
		fi
	done
done
