#!/bin/bash

LIMIT=888
LOG=log-sent.tsv
ERRLOG=err-sent.tsv
touch "$LOG"
touch "$ERRLOG"
count=0
diff -w <(sort "$LOG") <(sort email-addresses.tsv) \
| grep -P '^>' \
| perl -pe 's/^> //' \
| while read -r line; do
	if grep -q "$line" "$LOG"; then
		echo "ALREADY SUCCEEDED $line"
		continue
	fi
	if grep -q "$line" "$ERRLOG"; then
		echo "ALREADY FAILED $line"
		continue
	fi
	if [[ $(wc -l "$LOG"|cut -d' ' -f1) -ge $LIMIT ]]; then break; fi
	echo "== $line"
	name="$(cut -f1 <<< "$line")"
	home="$(cut -f2 <<< "$line")"
	IFS=$'\t' read -r -a addrs < <(cut -f3- <<< "$line")
	echo -e "\taddrs ${addrs[@]}"
	if ./sendone.sh "$name" "${addrs[@]}"; then
		echo "$line" >> "$LOG"
	else
		code=$?
		echo "$line" >> "$ERRLOG"
		echo "SKIPPED (FAILURE) err[$code]" >> "$ERRLOG"
	fi
done
