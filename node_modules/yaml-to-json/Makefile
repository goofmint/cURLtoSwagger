all: build

.PHONY: build
build:
	coffee --output lib --compile src

test: build
	rm -rf test/build
	mocha test \
		--require should \
		--compilers coffee:coffee-script/register
