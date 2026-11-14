import {
  canonical,
  hasUnsettledReply,
  type ReplyRow,
} from "../workspace/reply-recovery";
import {
  isOrdinaryReply,
  isWritingContext,
  type PublicWritingContext,
} from "../workspace/writing";

type Shape =
  | true
  | "url"
  | "attachment-name"
  | "option-name"
  | readonly [Shape]
  | { readonly [key: string]: Shape };
const account = { kind: true, id: true, name: true } as const;
const field = { name: "attachment-name", value: true, disabled: true } as const;
const option = {
  name: "option-name",
  label: true,
  kind: true,
  value: true,
  checked: true,
  disabled: true,
  maxLength: true,
  minimum: true,
  maximum: true,
  step: true,
  choices: [{ value: true, label: true, disabled: true }],
} as const;
const draft = {
  threadId: true,
  postId: true,
  url: "url",
  version: true,
} as const;
const upload = {
  key: true,
  name: true,
  type: true,
  size: true,
  loaded: true,
  message: true,
  status: true,
  serverId: true,
  ownerId: true,
  referenceKind: true,
  originalSha256: true,
  fields: [field],
  storedPost: { threadURL: "url", postId: true },
} as const;
const baseline = {
  title: true,
  source: true,
  category: option,
  options: [option],
  uploadedReferences: [true],
  attachmentFields: [field],
} as const;
const prepared = {
  ...baseline,
  action: true,
  uploads: [upload],
  replyTarget: { threadId: true, postId: true, author: true, authorId: true },
  mentions: [{ id: true, name: true }],
  existingRedPacket: true,
  redPacket: { hints: [true] },
  editTarget: { threadId: true, postId: true, threadURL: "url", baseline },
  draftSaveAvailable: true,
  draft,
  board: { id: true, label: true, url: "url" },
  account,
  titleAvailable: true,
} as const;
const submitted = {
  contextId: true,
  revision: true,
  writing: prepared,
} as const;
const packet = {
  state: true,
  conditions: [true],
  credit: true,
  ledger: {
    state: true,
    rows: [{ operation: true, change: true, details: true, time: true }],
  },
} as const;
const normalization = { name: true, submitted: true, stored: true } as const;
const verification = {
  stored: true,
  normalizations: [normalization],
  attachmentNormalizations: [normalization],
  creationEffects: [
    { name: true, requested: true, included: true, outcome: true },
  ],
} as const;
const attempt = {
  redPacket: packet,
  id: true,
  publication: {
    id: true,
    generation: true,
    submission: submitted,
    replyBefore: {
      pageURL: "url",
      postIds: [true],
      owned: [{ postId: true, writing: prepared }],
    },
  },
  status: true,
  message: true,
  checked: true,
  candidateURL: "url",
  replyComparison: { postId: true, before: prepared, observed: prepared },
  result: { threadId: true, postId: true, url: "url", verification },
} as const;
const draftAttempt = {
  redPacket: packet,
  fundingReviewed: true,
  observation: {
    packetMarker: true,
    state: true,
    content: true,
    attachments: true,
    attachmentNormalizations: [normalization],
  },
  checked: true,
  resendOf: true,
  priorDraftIds: [true],
  operation: true,
  publishedURL: "url",
  id: true,
  generation: true,
  submission: submitted,
  status: true,
  message: true,
  result: draft,
} as const;
const privateAttempt = {
  id: true,
  submission: {
    contextId: true,
    revision: true,
    writing: {
      action: true,
      account,
      recipient: { id: true, name: true, url: "url" },
      source: true,
      maxLength: true,
    },
  },
  before: [true],
  status: true,
  checked: true,
  message: true,
  result: {
    messageId: true,
    url: "url",
    senderId: true,
    recipientId: true,
    source: true,
  },
} as const;
const writingShape = {
  ...prepared,
  id: true,
  revision: true,
  editorUnresolved: true,
  selection: { start: true, end: true, direction: true },
  unappliedPacketOptions: [option],
  attempts: [attempt],
  draftAttempts: [draftAttempt],
  privateAttempts: [privateAttempt],
} as const;
function project(value: unknown, shape: Shape): unknown {
  if (value === null || value === undefined) return value;
  if (shape === "url") {
    if (typeof value !== "string") throw Error("Expected qualified URL");
    const url = new URL(value);
    const allowed =
      url.pathname === "/home.php"
        ? {
            mod: /^space$/,
            do: /^pm$/,
            subop: /^view$/,
            touid: /^[1-9]\d*$/,
            page: /^[1-9]\d*$/,
            daterange: /^\d+$/,
          }
        : {
            mod: /^(?:forumdisplay|viewthread)$/,
            fid: /^[1-9]\d*$/,
            tid: /^[1-9]\d*$/,
            pid: /^[1-9]\d*$/,
            page: /^[1-9]\d*$/,
            authorid: /^[1-9]\d*$/,
            tsdmapp: /^json$/,
          };
    if (
      url.origin !== "https://www.tsdm39.com" ||
      url.username ||
      url.password ||
      !["/forum.php", "/home.php"].includes(url.pathname) ||
      (url.hash && !/^#(?:pid[1-9]\d*|pmlist_[1-9]\d*)$/.test(url.hash)) ||
      [...url.searchParams].some(
        ([key, item]) =>
          url.searchParams.getAll(key).length !== 1 ||
          !(allowed as Record<string, RegExp>)[key]?.test(item),
      )
    )
      throw Error("Unqualified durable URL");
    return value;
  }
  if (shape === "option-name") {
    // This versioned inert vocabulary mirrors qualified native writing controls,
    // including already-retained historical packet settings. Unknown native
    // names must not smuggle hidden authority through an otherwise valid option.
    const names = [
      "typeid",
      "usesig",
      "parseurloff",
      "smileyoff",
      "bbcodeoff",
      "htmlon",
      "imgcontent",
      "price",
      "readperm",
      "hiddenreplies",
      "ordertype",
      "allownoticeauthor",
      "addfeed",
      "adddynamic",
      "adddynamic_doing",
      "tags",
      "hb_total",
      "hb_shares",
      "hb_split",
      "hb_cond",
      "hb_password",
      "hb_appoint",
      "hb_expire",
      "hb_blessing",
    ];
    if (typeof value !== "string" || !names.includes(value))
      throw Error("Unqualified durable writing option");
    return value;
  }
  if (shape === "attachment-name") {
    if (
      typeof value !== "string" ||
      !/^(?:attachnew\[[1-9]\d*\]\[(?:description|readperm|price)\]|attachupdate\[[1-9]\d*\])$/.test(
        value,
      )
    )
      throw Error("Unqualified durable attachment field");
    return value;
  }
  if (shape === true) {
    if (typeof value === "object") throw Error("Unexpected structured field");
    return value;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) throw Error("Expected list");
    return value.map((item) => project(item, shape[0]!));
  }
  if (typeof value !== "object" || Array.isArray(value))
    throw Error("Expected object");
  return Object.fromEntries(
    Object.entries(shape)
      .filter(([key]) => key in value)
      .map(([key, child]) => [
        key,
        project((value as Record<string, unknown>)[key], child),
      ]),
  );
}
export function projectReply(value: unknown): PublicWritingContext {
  const projected = project(value, writingShape);
  if (!isWritingContext(projected) || !isOrdinaryReply(projected))
    throw Error("Invalid ordinary reply");
  // Selected bytes belong only to the live owner. The durable current draft
  // carries unavailable intent; historical submissions above remain exact.
  return projected.uploads
    ? {
        ...projected,
        uploads: projected.uploads.map((upload) =>
          upload.status === "selected"
            ? {
                ...upload,
                status: "reselect",
                message:
                  "File bytes are not retained across refresh. Select the file again.",
              }
            : upload,
        ),
      }
    : projected;
}
/** Only call with validated legacy session/current durable intent, never new unknown input. */
export function recoverReplyOwners(
  value: PublicWritingContext,
): PublicWritingContext {
  return value.uploads
    ? {
        ...value,
        uploads: value.uploads.map((upload) =>
          upload.serverId && upload.ownerId === undefined
            ? { ...upload, ownerId: value.account.id }
            : upload,
        ),
      }
    : value;
}
/** New current intent never writes an implicit uploader. Historical snapshots stay exact. */
export function explicitReplyOwners(
  value: PublicWritingContext,
): PublicWritingContext {
  return value.uploads
    ? {
        ...value,
        uploads: value.uploads.map((upload) =>
          upload.serverId && upload.ownerId === undefined
            ? { ...upload, ownerId: null }
            : upload,
        ),
      }
    : value;
}
export function replyMeaning(value: PublicWritingContext | null): string {
  if (!value) return "null";
  const result = { ...recoverReplyOwners(value) } as Record<string, unknown>;
  for (const key of ["id", "account", "revision", "selection"])
    delete result[key];
  return canonical(result);
}
export async function replyFingerprint(
  value: PublicWritingContext | null,
): Promise<string> {
  const result = value ? ({ ...value } as Record<string, unknown>) : null;
  if (result) {
    delete result.revision;
    delete result.selection;
    if (value && isOrdinaryReply(value) && value.uploads)
      result.uploads = value.uploads.map((upload) => {
        if (!upload.serverId || upload.ownerId !== value.account.id)
          return upload;
        // All #107 hash inputs lacked this key. Only redundant current provenance is omitted.
        const { ownerId: _owner, ...intent } = upload;
        void _owner;
        return intent;
      });
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(result)),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
function validRow(value: unknown): value is ReplyRow {
  if (!value || typeof value !== "object") return false;
  const row = value as ReplyRow;
  if (
    ![1, 2].includes(row.schema) ||
    (row.schema === 1
      ? row.retained !== undefined
      : !Array.isArray(row.retained)) ||
    !/^[1-9]\d*$/.test(row.threadId) ||
    !Array.isArray(row.variants) ||
    !row.variants.length ||
    Object.keys(row).some(
      (key) =>
        ![
          "schema",
          "threadId",
          "variants",
          ...(row.schema === 2 ? ["retained"] : []),
        ].includes(key),
    )
  )
    return false;
  const ids = new Set<string>();
  return [...row.variants, ...(row.retained ?? [])].every((variant) => {
    if (
      !variant ||
      !uuid(variant.version) ||
      !(variant.parent === null || uuid(variant.parent)) ||
      ids.has(variant.version) ||
      Object.keys(variant).some(
        (key) => !["version", "parent", "context"].includes(key),
      )
    )
      return false;
    ids.add(variant.version);
    if (variant.context === null) return true;
    try {
      const context = projectReply(variant.context);
      return (
        context.replyTarget!.threadId === row.threadId &&
        canonical(context) === canonical(variant.context)
      );
    } catch {
      return false;
    }
  });
}
export function createReplyDraftStore() {
  let database: Promise<IDBDatabase> | null = null;
  async function open() {
    database ??= new Promise<IDBDatabase>((resolve, reject) => {
      let settled = false;
      const request = indexedDB.open("tsdm.workspace.reply-drafts", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("threads", { keyPath: "threadId" });
      request.onerror = () => {
        settled = true;
        database = null;
        reject(request.error);
      };
      request.onblocked = () => {
        settled = true;
        database = null;
        reject(Error("Draft database upgrade blocked"));
      };
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          database = null;
        };
        resolve(db);
      };
    });
    return database;
  }
  async function transaction<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore, done: (value: T) => void) => void,
  ): Promise<T> {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction("threads", mode, { durability: "strict" });
      if (mode === "readwrite" && tx.durability !== "strict") {
        tx.abort();
        reject(Error("Strict durable acknowledgement unavailable"));
        return;
      }
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(tx.error ?? Error("Draft transaction aborted"));
      tx.onerror = () => {
        /* onabort is the transaction outcome */
      };
      try {
        action(tx.objectStore("threads"), (value) => {
          result = value;
        });
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }
  return {
    async read(): Promise<ReplyRow[]> {
      const rows = await transaction<unknown[]>("readonly", (store, done) => {
        const request = store.getAll();
        request.onsuccess = () => done(request.result);
      });
      if (!rows.every(validRow))
        throw Object.assign(Error("Incompatible durable reply data"), {
          raw: JSON.stringify(rows),
        });
      return rows;
    },
    async choose(
      observed: ReplyRow,
      version: string,
    ): Promise<ReplyRow | null> {
      return transaction<ReplyRow | null>("readwrite", (store, done) => {
        const request = store.get(observed.threadId);
        request.onsuccess = () => {
          const current: unknown = request.result;
          if (!validRow(current)) {
            request.transaction?.abort();
            return;
          }
          if (canonical(current) !== canonical(observed)) {
            done(null);
            return;
          }
          const all = [...current.variants, ...(current.retained ?? [])];
          const selected = all.find((item) => item.version === version);
          if (!selected) {
            done(null);
            return;
          }
          const next: ReplyRow = {
            schema: 2,
            threadId: current.threadId,
            variants: [selected],
            retained: all.filter((item) => item.version !== version),
          };
          store.put(next);
          done(next);
        };
      });
    },
    async discard(
      observed: ReplyRow,
      version: string,
    ): Promise<ReplyRow | null> {
      return transaction<ReplyRow | null>("readwrite", (store, done) => {
        const request = store.get(observed.threadId);
        request.onsuccess = () => {
          const current: unknown = request.result;
          if (!validRow(current)) {
            request.transaction?.abort();
            return;
          }
          if (
            canonical(current) !== canonical(observed) ||
            !current.retained?.some((item) => item.version === version)
          ) {
            done(null);
            return;
          }
          if (
            current.retained.some(
              (item) =>
                item.version === version && hasUnsettledReply(item.context),
            )
          ) {
            request.transaction?.abort();
            return;
          }
          const next: ReplyRow = {
            ...current,
            retained: current.retained.filter(
              (item) => item.version !== version,
            ),
          };
          store.put(next);
          done(next);
        };
      });
    },
    async save(
      threadId: string,
      context: PublicWritingContext | null,
      parent: string | null,
    ): Promise<ReplyRow> {
      if (context) context = explicitReplyOwners(context);
      return transaction<ReplyRow>("readwrite", (store, done) => {
        const request = store.get(threadId);
        request.onsuccess = () => {
          const old: unknown = request.result;
          if (old !== undefined && !validRow(old)) {
            request.transaction?.abort();
            return;
          }
          const variants = old === undefined ? [] : (old as ReplyRow).variants;
          if (
            context === null &&
            variants.some((item) => hasUnsettledReply(item.context))
          ) {
            request.transaction?.abort();
            return;
          }
          const existing = variants.find(
            (item) => canonical(item.context) === canonical(context),
          );
          if (existing) {
            done(old as ReplyRow);
            return;
          }
          const next: ReplyRow = {
            schema: old === undefined ? 1 : (old as ReplyRow).schema,
            ...((old as ReplyRow | undefined)?.schema === 2
              ? { retained: (old as ReplyRow).retained }
              : {}),
            threadId,
            variants: [
              ...variants.filter((item) => item.version !== parent),
              { version: crypto.randomUUID(), parent, context },
            ],
          };
          store.put(next);
          done(next);
        };
      });
    },
  };
}
