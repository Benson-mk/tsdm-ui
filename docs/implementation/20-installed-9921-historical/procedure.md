# Repeatable procedure — historical 9921 boundaries

This is a fresh authored procedure, not a controller export. Repeating it
produces new evidence for the source actually executed. It does not change the
historical incomplete status of the 9921 candidate or authorize a forum write.

## 1. Fix source and build identity

Use the source snapshot corresponding to version 0.3.0 / 887221 bytes /
SHA-256 `9921f8ad772eaf2fe532b09f14cb2f5dd3378989b6da81ef598a00b475ed8052`
when repeating this historical build. Record a different hash as a different
candidate. Do not assume the latest mutable working tree reproduces 9921.
Use Node 24.22.0, npm 11.21.1 and the locked dependencies; the expected lockfile
SHA-256 is
`2855b0d9260df201dda5f0c775669e8941cb9716a35e54757d0e6cd0035e7825`.

From that frozen source, the deterministic application and public-package
consumer commands are:

```sh
npm ci
npm run build
npm run test:e2e
npm run test:consumer
```

Record userscript/library hashes and the new receipt/report/manifests. The
historical application alias `2026-10-21T09-07-22.806Z` retains 356/356 passes;
`consumer-2026-10-21T09-06-12.812Z` retains 15 publication cases. Those names
identify prior artifacts, not a promise that newly executed code has passed.

## 2. Establish the installed setup

In task-owned browser contexts, officially back up the previous userscript,
install the frozen candidate and obtain complete official source readbacks.
Compare all bytes and preserve the backup. Independently inspect the complete
executing script source/inventory and require one exact matching copy in each
selected browser. Record exact installed browser/manager/OS versions and their
provenance, together with date/timezone. A version label alone is insufficient.

Use Edge then Chrome for the bounded installed covering set. Preserve the
original live contexts; run controlled cases in disposable task-owned tabs.
Arm complete network observation independently of script-debug volume.

## 3. Control external HTTP while retaining real browser mechanics

Use an authored deterministic response controller at the application HTTP seam.
Keep the installed userscript, native storage methods, ordinary input controls,
history and focus unchanged. Populate nonempty authored board/form/source/
post responses and keep independently recorded synthetic stored values.
Control request-stage XHR/Fetch only, with explicit matching origin and method
checks. Fulfil or fail controlled requests; do not continue publication requests
to the live forum. Fail closed on unexpected application POSTs.

Do not attempt to fulfil browser-managed Document or response-stage events.
Observe native Document/static/background traffic separately and describe it
as normal uncontrolled traffic; a zero application publication count is not
zero total network. Make each synthetic case's intended interception coverage
explicit before its first action.

For each bounded action, record start/end cursors, drain all event batches and
preserve request/response/completion observations. Reject a scope as request
count evidence when it is truncated, has unread events, or continuity is not
established. Do not sum overlapping cumulative ledgers. Record POST requests,
synthetic accepted posts and live forum effects as separate quantities.

## 4. Exercise the controlled case families

- Exhaust actual native sessionStorage capacity using a task-owned filler,
  preserving a known acknowledged baseline before refusal. Attempt publication
  through the real UI, compare the acknowledged record and visible writing,
  and establish no publication request after refused acknowledgement. Restore
  only the task-owned diagnostic storage afterward.
- Hold an accepted synthetic response. Observe the pending original identity
  and duplicate guard; make later title/source/options edits through the UI.
  Release the response, compare the independent stored original revision and
  verify later writing survives. Fail later reader HTTP only after established
  confirmation; return/reload and inspect the retained confirmation and writing.
- Store a synthetic post but lose its response. Inspect uncertainty, explicitly
  Check result for the original attempt, and verify one total publication POST.
  Repeat pending reload with a held synthetic request: restored uncertainty
  must not automatically send/check; explicit Check result retains identity.
- Use separate authored rejection and moderation responses. Count a rejected
  POST independently from accepted synthetic storage. Do not induce these
  failures with repeated real forum writes.
- Change only external account representations before preparation, between
  preparation and send, during the held POST and during source readback.
  Preserve truthful not-sent/uncertain states. Do not mutate real account
  cookies or infer atomic isolation or rollback.

Capture full DOM/native recovery values separately from screenshots. Inspect
actual screenshots while retaining their viewport/scroll limitations. Mark
failed controller attempts inconclusive rather than replacing them silently.

## 5. Observe keyboard and appearance outcomes

Exercise actual range keys, source-caret keys, Settings focus/Escape and native
continuation when the workspace is absent. Use real native handlers and trusted
UI input. A passive composed-path trace may establish retargeting; do not patch
native controls, location or application internals to manufacture success.
Compare focus, caret, modal state, writing, history and native Document requests.

The historical 9921 range/caret path fails this boundary. A corrected candidate
needs a new affected installed observation in both browsers; this procedure
does not call the old run repaired. If temporarily changing text size or
viewport, restore original preferences and clear the override. Narrow 150%
images alone do not establish responsive coverage.

## 6. Bound any separately authorized live check

First show the exact actor/destination/title/source/current options for the
specific authorized ordinary free publication. Confirm the applicable write
budget; previous evidence is not permission to create another thread. Retain
immutable submitted controls, revision and attempt identity before sending.
Do not induce live loss, rejection, duplicate submission, spending, uploads or
cleanup merely to reproduce a synthetic failure.

Observe a single bounded send and preserve complete native request and inert
response evidence. Independently read the public opening identity/author/board/
title and owned complete source/persistent controls through fresh GETs. Treat
callback data only as candidate evidence. Retain actual submitted and stored
values separately; absent controls remain unknown unless their semantics are
specifically qualified. A callback feed identifier is not delivery evidence.

Stop sends on an unsupported or uncertain result. Preserve the original attempt
and inspect that same result using authorized GET-only Check result. Do not
create another Edge thread to recover the historical original. Chrome's
historical zero-send state is not permission to spend its remaining budget.
The supplied reference thread stays intact.

## 7. End interception safely and preserve evidence

Drain or retain the exact pending-gate state. Keep request-stage interception
active until the disposable synthetic tab closes. Never disable Fetch with
paused requests: doing so could release them to the live origin. Close the
controlled tab under active interception, then record observer lifetime,
preference/viewport restoration and the preserved original task contexts.

Reconstruct any new response controller as a complete maintained program with
explicit inputs. Some historical `.toString()` fragments depend on REPL
closures; they are not standalone replay programs. Keep those attempts as
historical artifacts without silently claiming standalone reproducibility.

## 8. Author and verify a public package

Keep raw authenticated captures, member/target identifiers, headers, tokens,
URLs, screenshots and workstation paths private. Create a new authored report,
receipt and procedure with semantic aliases, exact candidate, predicates and
limitations. Never turn a redacted raw capture dump into the public package.
Keep all five acceptance rows unchecked until the independent completed-work
and installed acceptance judgment actually supports them.

Verify this package from the directory containing its `manifest.json`:

```sh
python3 - <<'PY_VERIFY'
from pathlib import Path
import hashlib, json
root = Path('.')
manifest = json.loads((root / 'manifest.json').read_text())
actual = {p.name for p in root.iterdir() if p.is_file()} - {'manifest.json'}
assert actual == set(manifest)
for name, item in manifest.items():
    assert Path(name).name == name
    data = (root / name).read_bytes()
    assert len(data) == item['bytes']
    assert hashlib.sha256(data).hexdigest() == item['sha256']
print(f'Verified {len(manifest)} authored files')
PY_VERIFY
```

The package's own manifest covers only authored bytes. A private-input audit
and its documented predicate limits remain separate; neither a file hash nor
an earlier successful receipt supplies missing native behavior.
