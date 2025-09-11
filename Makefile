.PHONY: clean serve js

all: js

js: 
	npm run build

clean:
	rm -rf dist/*

serve:
	npm run serve

test:
	npm run test

bundle: js
	npm run bundle
