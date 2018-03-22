#!/usr/bin/env bash

# integer literals
curl https://raw.githubusercontent.com/WebAssembly/spec/master/test/core/int_literals.wast \
	| head -n70 \
	| grep -oP "(i(32|64).const\K\s*((\d|-|x|_|\+|[a-zA-Z])*))" \
	> packages/wast-parser/test/tokenizer/raw/int_literals.txt

# float literals
curl https://raw.githubusercontent.com/WebAssembly/spec/master/test/core/float_literals.wast \
	| head -n181 \
	| grep -oP "(f(32|64).const\K\s*((\d|-|x|_|\+|\.|[a-zA-Z]|:)*))" \
	> packages/wast-parser/test/tokenizer/raw/float_literals.txt

