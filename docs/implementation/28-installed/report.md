# Issue 28 installed development report

The frozen `6457a604c049` candidate delivered both an ordinary attachment and an already-accessible paid attachment through its real browser Save path in macOS Edge, then Chrome. Official MCP replacement and exact stored-source readback matched the distributed 669,720-byte SHA-256 in [receipt.json](receipt.json). One listed Workspace source and newly executing controls were observed in each browser.

| Browser | Run-local file alias | Expected / saved bytes | Saved-name outcome                  | Independent outcome                             |
| ------- | -------------------- | ---------------------- | ----------------------------------- | ----------------------------------------------- |
| Edge    | ordinary-A.txt       | 47 / 47                | Native name plus collision suffix 7 | Browser complete; disk SHA-256 matches original |
| Edge    | paid-A.txt           | 169 / 169              | Native name unchanged               | Browser complete; disk SHA-256 matches original |
| Chrome  | ordinary-A.txt       | 47 / 47                | Native name plus collision suffix 8 | Browser complete; disk SHA-256 matches original |
| Chrome  | paid-A.txt           | 169 / 169              | Native name plus collision suffix 1 | Browser complete; disk SHA-256 matches original |

Aliases are deliberately not the actual filenames. Private receipts retain exact names/paths, expected sizes and actual SHA-256 values; no paid bytes or member captures are included here. All four files were independently rehashed a second time during acceptance documentation and matched. File bytes were unchanged; only collision suffixes altered saved names.

Each case recorded one fresh containing-thread request and one current opaque attachment request. The binary request had no `tsdmapp`, returned HTTP 200 `application/octet-stream`, and required no POST, purchase or retry. A separately authorized native fixture-setup purchase preceded the paid case; the application only consumed currently offered access. Product feedback stayed “Browser save requested” and explicitly could not confirm saved or cancelled. Browser completion and independent disk observations supply the file-outcome evidence.

The selected environment was macOS 15.6 build 24G84 arm64, browser runtime major 155, user-reported Tampermonkey BETA 5.6.6242 / Editors 1.0.7. Application-bundle metadata subsequently read Edge 155.0.4283.62 and Chrome 155.0.8059.84, agreeing with the earlier environment record; this is not a new full runtime-string capture.

The same candidate passed 99 full application E2Es, including actual synthetic browser file-save/refusal readback, plus a clean external consumer and strict build/type/lint/format checks. Completed standards/spec review and BDFL evaluation found no confirmed #28 defect. Conservative markup/HTML/JSON/XML/empty-payload refusal remains a disclosed coverage limit. An installed cancellation, universal format support, the stable/Windows release matrix and the final combined candidate are not claimed.

Replay the synthetic source and the seven-step installed procedure in [the acceptance audit](../28-acceptance.md), using your own authorized accessible fixtures. Verify this package with `npm run evidence:verify -- docs/implementation/28-installed`. Raw installed screenshots and private files must stay outside the public package. The final integrated candidate requires its own qualification; these results are tied to the exact hash above.
