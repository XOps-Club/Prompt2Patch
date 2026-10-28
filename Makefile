.PHONY: install dev test test-eval test\:eval build clean

install:
	npm install

dev:
	npm run dev

test:
	npm test

test-eval:
	@if [ -f tests/eval_hidden.test.ts ]; then \
		npx tsx --test tests/eval_hidden.test.ts; \
	else \
		echo "[Evaluation] Hidden evaluation suite (tests/eval_hidden.test.ts) is reserved for grading."; \
	fi

test\:eval: test-eval

build:
	npm run build

clean:
	rm -rf dist linksnip.db
