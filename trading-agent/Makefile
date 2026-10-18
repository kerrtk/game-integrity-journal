.PHONY: test fetch research paper status
test:      ; python3 -m pytest -q
fetch:     ; python3 -m tradeagent fetch --since 2017-01-01
research:  ; python3 -m tradeagent research --data $(DATA)
paper:     ; python3 -m tradeagent paper --manifest $(MANIFEST)
status:    ; python3 -m tradeagent status
