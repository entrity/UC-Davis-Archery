#!/bin/bash

LOG=sent.tsv
touch "$LOG"
diff "$LOG" ../email-addresses.tsv \
| grep -P '^>' \
| perl -pe 's/^> //' \
| while read -r line; do
	name=$(cut -f1 <<< "$line")
	home=$(cut -f2 <<< "$line")
	IFS=$'\t' read -r -a addrs < <(cut -f3- <<< "$line")
	printf "\n$name\t$home"  >> "$LOG"
	for addr in "${addrs[@]}"; do
		echo addr $addr
		printf "\t$addr" >> "$LOG"
	done 
done
