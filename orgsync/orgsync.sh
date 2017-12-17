#!/bin/bash

OUT=email-addresses.tsv
truncate --size 0 "$OUT"

while read -r line; do
	# orgsync.com/50283
	echo $line
	title=`curl -s "https://$line/chapter" | grep -P -o '(?<=<h1>)(.*)(?=</h1>)'`
	# https://orgsync.com/50312/chapter/display_profile
	fname="$(echo "$line" | perl -nwE 'say /\d/g').tmp"
	[[ -e "$fname" ]] || wget -o "$fname" "http://$line/chapter/display_profile" -O "$fname" || exit 4ma
	printf "$title\t" | tee -a "$OUT"
	printf "%s\t" "http://$line/chapter" | tee -a "$OUT"
	grep -P -o '[^ ><"\\:]+@[^ ><"\\:]+' "$fname" | uniq | tr "\n" "\t" | tee -a "$OUT"
	echo | tee -a "$OUT"
done < orgsync.txt
