.PHONY: serve install deploy

serve:
	npm run dev

install:
	npm install

deploy:
	git add -A && git commit -m "Auto-commit from make deploy 🤖" && git push
