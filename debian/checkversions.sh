#!/bin/bash
set -e

cd src
appver=$(node dali.js --version)
cd - >> /dev/null

packagever=$(head -1 debian/changelog | sed 's/[a-zA-Z0-9-]\+ (\([0-9.]\+\)).*/\1/g')

if [ "$appver" != "$packagever" ]
then
	echo "Version mismatch between debian/changelog ($packagever) and src/dali.js ($appver)"
	exit 1
fi


