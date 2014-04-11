SRC = public/js/app.js public/js/directives.js public/js/filters.js public/js/controllers.js public/js/services.js

hint:
	./node_modules/.bin/jshint --onevar false public/js/*.js

build: $(SRC)
	cat $^ > public/js/magic-chest.js

min: build
	./node_modules/.bin/uglifyjs --no-mangle public/js/magic-chest.js > public/js/magic-chest.min.js
	
min2: build	
	java -jar ../../closure-compiler/compiler.jar --js public/js/magic-chest.js --compilation_level SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT5_STRICT --js_output_file public/js/magic-chest.min.js