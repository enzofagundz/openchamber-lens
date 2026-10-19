(() => {
  // node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;
  // node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root = doc.documentElement;
    if (root.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root.setAttribute("data-oc-scrollbar-activity", "");
    const timers = new WeakMap;
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== undefined)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1000));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;
  // node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;
  // node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;
  // node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = new Set;
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== undefined && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = new Set;
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };
  // node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 20000000;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var patternExpressions = new Map;
  var fileEditorPayloadSize = (value) => ("bytes" in value) ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0;index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };
  // node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16000;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request) => {
    try {
      if (String(request.id) !== request.id || !GUEST_POPOVER_ID.test(request.id) || !Number.isFinite(request.anchor.x) || Math.abs(request.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.y) || Math.abs(request.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.width) || !Number.isFinite(request.anchor.height) || request.anchor.width <= 0 || request.anchor.height <= 0 || request.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request.width) || request.width < GUEST_POPOVER_WIDTH_MIN || request.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request.height) || request.height < GUEST_POPOVER_HEIGHT_MIN || request.height > GUEST_POPOVER_HEIGHT_MAX || request.side !== undefined && !GUEST_POPOVER_SIDES.includes(request.side) || request.focus !== undefined && request.focus !== true && request.focus !== false || !hasBoundedJsonTree(request.data) || !isFiniteJson(request.data))
        return false;
      return JSON.stringify(request.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32000;
  var GUEST_COMPOSE_TEXT_MAX = 16000;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2000;
  var GUEST_ATTACH_TEXT_MAX = 16000;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16000;
  var GUEST_REQUEST_PATH_MAX = 2000;
  var GUEST_REQUEST_TIMEOUT_MS = 20000;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2000000;
  var GUEST_GENERATE_PROMPT_MAX = 64000;
  var GUEST_GENERATE_SYSTEM_MAX = 8000;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4000;
  var GUEST_GENERATE_TIMEOUT_MS = 90000;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "REQUEST_FAILED",
    "RESPONSE_TOO_LARGE",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === undefined)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request) => {
    const id = request.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request.branches?.head);
      const base = clampBranch(request.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request.data)) {
      next.data = request.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request) => {
    const next = clampAttachRequest(request);
    if (request.projectId)
      next.projectId = request.projectId;
    if (request.navigation)
      next.navigation = request.navigation;
    if (request.worktree) {
      next.worktree = request.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request) => {
    const next = {
      text: request.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\x00") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\x00") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire) => {
    if (!isNonEmptyString(wire.id))
      return null;
    if (wire.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: true
      };
      if (Object(wire.payload) === wire.payload) {
        message.payload = wire.payload;
      }
      return message;
    }
    if (wire.ok === false && isNonEmptyString(wire.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: false,
        error: wire.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : undefined)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire = asWireRecord(data);
    if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire.type === "result")
      return readResultMessage(wire);
    if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
      return null;
    return wire;
  };

  // node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => ("key" in event) && ("metaKey" in event) && ("ctrlKey" in event);
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";

  class HostRequestError extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.name = "HostRequestError";
      this.code = code;
    }
  }
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === undefined)
      return;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== undefined && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : undefined;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = new Set;
    const directoryListeners = new Set;
    const sessionListeners = new Set;
    const lifecycleListeners = new Set;
    const connectionListeners = new Set;
    const settingsListeners = new Set;
    const itemListeners = new Set;
    const statusControlListeners = new Set;
    const popoverClosedListeners = new Set;
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = new Set;
    const fileSavedListeners = new Set;
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = new Map;
    const workspaceListeners = new Map;
    const shellsListeners = new Map;
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer });
        post(message);
      });
    };
    const request = (message) => send(message).then(() => {
      return;
    });
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      closePopover(lastReady.popover.id, "escape").catch(() => {
        return;
      });
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : undefined;
      if (!popover)
        return;
      const active = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active)
        return;
      popoverActivityReported = active;
      setPopoverAnchorActive(popover.id, active).catch(() => {
        return;
      });
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== undefined && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== undefined && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : undefined;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      openSurface: (surfaceId) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== undefined)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== undefined)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== undefined)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 180000);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input) => {
        const prompt = input.prompt.trim();
        const system = input.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== undefined && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input.maxOutputTokens === undefined ? undefined : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input.maxOutputTokens)));
        if (maxOutputTokens !== undefined && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== undefined)
          payload.system = system;
        if (maxOutputTokens !== undefined)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      setBadge: (count) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
      }
    };
  };
  // node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 60000;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
  // node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);
  // node_modules/@openchamber/sdk/dist/ui/theme.js
  var TOKEN_VARS = [
    ["--oc-bg", "background"],
    ["--oc-elevated", "elevated"],
    ["--oc-fg", "foreground"],
    ["--oc-muted", "muted"],
    ["--oc-subtle", "subtle"],
    ["--oc-border", "border"],
    ["--oc-hover", "hover"],
    ["--oc-selection", "selection"],
    ["--oc-focus", "focus"],
    ["--oc-primary", "primary"],
    ["--oc-muted-surface", "mutedSurface"],
    ["--oc-elevated-fg", "elevatedForeground"],
    ["--oc-active", "active"],
    ["--oc-selection-fg", "selectionForeground"],
    ["--oc-primary-fg", "primaryForeground"],
    ["--oc-primary-text", "primaryText"],
    ["--oc-success-text", "successText"],
    ["--oc-warning-text", "warningText"],
    ["--oc-error-text", "errorText"],
    ["--oc-info-text", "infoText"],
    ["--oc-success", "success"],
    ["--oc-warning", "warning"],
    ["--oc-error", "error"],
    ["--oc-info", "info"],
    ["--oc-font", "font"],
    ["--oc-mono", "mono"],
    ["--oc-radius", "radius"],
    ["--surface-background", "background"],
    ["--surface-elevated", "elevated"],
    ["--surface-foreground", "foreground"],
    ["--surface-muted-foreground", "muted"],
    ["--surface-subtle", "subtle"],
    ["--interactive-border", "border"],
    ["--interactive-hover", "hover"],
    ["--interactive-selection", "selection"],
    ["--interactive-focus-ring", "focus"],
    ["--primary", "primary"],
    ["--surface-muted", "mutedSurface"],
    ["--surface-elevated-foreground", "elevatedForeground"],
    ["--interactive-active", "active"],
    ["--interactive-selection-foreground", "selectionForeground"],
    ["--primary-foreground", "primaryForeground"],
    ["--primary-text", "primaryText"],
    ["--success-text", "successText"],
    ["--warning-text", "warningText"],
    ["--error-text", "errorText"],
    ["--info-text", "infoText"],
    ["--status-success", "success"],
    ["--status-warning", "warning"],
    ["--status-error", "error"],
    ["--status-info", "info"],
    ["--font-sans", "font"],
    ["--font-mono", "mono"],
    ["--radius", "radius"]
  ];
  var SYNTAX_TOKEN_VARS = [
    ["--oc-syntax-keyword", "--syntax-keyword", "syntaxKeyword"],
    ["--oc-syntax-string", "--syntax-string", "syntaxString"],
    ["--oc-syntax-number", "--syntax-number", "syntaxNumber"],
    ["--oc-syntax-function", "--syntax-function", "syntaxFunction"],
    ["--oc-syntax-type", "--syntax-type", "syntaxType"],
    ["--oc-syntax-comment", "--syntax-comment", "syntaxComment"],
    ["--oc-syntax-variable", "--syntax-variable", "syntaxVariable"],
    ["--oc-syntax-operator", "--syntax-operator", "syntaxOperator"]
  ];
  var applyHostTheme = (theme, root) => {
    root.style.colorScheme = theme.mode;
    for (const [name, key] of TOKEN_VARS) {
      root.style.setProperty(name, theme.tokens[key]);
    }
    for (const [alias, hostName, key] of SYNTAX_TOKEN_VARS) {
      const value = theme.tokens[key] ?? "";
      root.style.setProperty(alias, value);
      root.style.setProperty(hostName, value);
    }
    root.style.setProperty("font-family", theme.tokens.font);
    root.style.setProperty("font-size", "0.875rem");
    root.style.setProperty("line-height", "1.45");
    root.style.setProperty("color", theme.tokens.foreground);
  };
  var applyHostReady = (ctx, root) => {
    applyHostTheme(ctx.theme, root);
    if (root.dataset) {
      root.dataset.ocSurface = ctx.surface;
      root.dataset.ocTheme = ctx.theme.mode;
    }
  };
  // node_modules/@openchamber/sdk/dist/ui/style.js
  var OC_ALIAS = {
    "surface-background": "bg",
    "surface-elevated": "elevated",
    "surface-elevated-foreground": "elevated-fg",
    "surface-foreground": "fg",
    "surface-muted-foreground": "muted",
    "surface-muted": "muted-surface",
    "surface-subtle": "subtle",
    "interactive-border": "border",
    "interactive-hover": "hover",
    "interactive-active": "active",
    "interactive-selection": "selection",
    "interactive-selection-foreground": "selection-fg",
    "interactive-focus-ring": "focus",
    primary: "primary",
    "primary-foreground": "primary-fg",
    "primary-text": "primary-text",
    "success-text": "success-text",
    "warning-text": "warning-text",
    "error-text": "error-text",
    "info-text": "info-text",
    "status-success": "success",
    "status-warning": "warning",
    "status-error": "error",
    "status-info": "info",
    "font-sans": "font",
    "font-mono": "mono",
    radius: "radius"
  };
  var v = (name, fallback) => `var(--${name}, var(--oc-${OC_ALIAS[name]}, ${fallback}))`;
  var bg = v("surface-background", "transparent");
  var elevated = v("surface-elevated", "transparent");
  var elevatedFg = v("surface-elevated-foreground", "inherit");
  var fg = v("surface-foreground", "inherit");
  var muted = v("surface-muted-foreground", "gray");
  var secondary = v("surface-muted", "transparent");
  var border = v("interactive-border", "currentColor");
  var hover = v("interactive-hover", "transparent");
  var active = v("interactive-active", "transparent");
  var selection = v("interactive-selection", "transparent");
  var selectionFg = v("interactive-selection-foreground", "inherit");
  var primary = v("primary", "currentColor");
  var primaryText = v("primary-text", "inherit");
  var errorText = v("error-text", "inherit");
  var font = v("font-sans", "inherit");
  var mono = v("font-mono", "monospace");
  var radius = v("radius", "9px");
  var controlRadius = `calc(${radius} - 2px)`;
  var smallRadius = `calc(${radius} - 4px)`;
  var mix = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  var focusFill = `background-image: linear-gradient(${hover}, ${hover});`;
  var field = (edge) => `box-shadow: inset 0 0 0 1px ${edge}, var(--oc-sdk-field-lift);`;
  var raised = "box-shadow: inset 0 0 0 1px var(--oc-sdk-edge), var(--oc-sdk-raised-lift);";
  var litButton = "box-shadow: var(--oc-sdk-lit);";
  var darkLift = `inset 0 1px 0 0 ${mix(fg, 1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2)`;
  var THEME_VARS = `
:root {
  --oc-sdk-edge: ${mix(fg, 10)};
  --oc-sdk-field-bg: ${elevated};
  --oc-sdk-raised-bg: ${bg};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.45), 0 1px 2px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.1), 0 1px 2px -0.5px rgb(0 0 0 / 0.08), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.08);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${mix(fg, 6)};
  --oc-sdk-field-bg: ${mix(bg, 50, elevated)};
  --oc-sdk-raised-bg: ${elevated};
  --oc-sdk-field-lift: ${darkLift};
  --oc-sdk-raised-lift: ${darkLift};
  --oc-sdk-lit: inset 0 1px 0 0 ${mix(fg, 1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.06), inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.36), 0 1px 1px -0.5px rgb(0 0 0 / 0.22), 0 3px 3px -1.5px rgb(0 0 0 / 0.2), 0 6px 6px -3px rgb(0 0 0 / 0.16);
}`;
  var tone = (name) => {
    const color = v(`status-${name}`, "currentColor");
    return `
.oc-sdk[data-tone="${name}"], .oc-sdk [data-tone="${name}"] { --oc-sdk-tone: ${color}; --oc-sdk-tone-text: ${v(`${name}-text`, "inherit")}; }`;
  };
  var UI_SIZE_CSS = `
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`;
  var GUEST_UI_LOOK_CSS = `${THEME_VARS}
.oc-sdk { color: ${fg}; font-family: ${font}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${focusFill} }
.oc-sdk-mono { font-family: ${mono}; }
.oc-sdk-muted { color: ${muted}; }
${tone("success")}${tone("warning")}${tone("error")}${tone("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${primary}; --oc-sdk-tone-text: ${primaryText}; }

.oc-sdk-btn { border-radius: ${controlRadius}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${smallRadius}; }
.oc-sdk-btn[data-variant="default"] { color: ${primaryText}; background: ${mix(primary, 10, bg)}; border-color: ${mix(primary, 12)}; ${litButton} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${mix(primary, 16, bg)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${mix(primary, 22, bg)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${secondary}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; border-color: transparent; ${raised} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${active}, ${active}); box-shadow: inset 0 0 0 1px var(--oc-sdk-edge); }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${hover}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${active}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${v("status-error", "red")}; color: ${errorText}; background: ${mix("var(--oc-sdk-tone)", 7, bg)}; border-color: ${mix("var(--oc-sdk-tone)", 12)}; ${litButton} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${mix("var(--oc-sdk-tone)", 9, bg)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${mix("var(--oc-sdk-tone)", 11, bg)}; box-shadow: none; }

.oc-sdk-field-note { color: ${muted}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${errorText}; }
.oc-sdk-input { border-radius: ${controlRadius}; background: var(--oc-sdk-field-bg); color: ${elevatedFg}; ${field("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${muted}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${field(mix(fg, 26))} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${field(v("status-error", "red"))} }
.oc-sdk-input[data-mono="true"] { font-family: ${mono}; }

.oc-sdk-search-icon { color: ${muted}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${primary}; }
.oc-sdk-search-clear { border-radius: ${smallRadius}; color: ${muted}; }
.oc-sdk-search-clear:hover { background: ${hover}; color: ${fg}; }

.oc-sdk-trigger { border-color: transparent; border-radius: ${controlRadius}; background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${muted}; }
.oc-sdk-trigger-chevron { color: ${muted}; }
/* The app's dropdown light: lit top, hairline rings and a layered shadow, no border. */
.oc-sdk-popup { --surface-foreground: ${elevatedFg}; border-color: transparent; border-radius: 12px; background: ${elevated}; color: ${elevatedFg}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${hover}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-option-check { color: ${fg}; }
.oc-sdk-option[data-destructive="true"] { color: ${errorText}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${mix(v("status-error", "red"), 10)}; }
.oc-sdk-option-hint { color: ${muted}; }
.oc-sdk-popup-empty { color: ${muted}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${border}; border-radius: 4px; color: ${fg}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${mix(fg, 60, border)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${border}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${bg}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${primary}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${focusFill} }
.oc-sdk-check-desc { color: ${muted}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${mix(fg, 4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${muted}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${fg}; }
.oc-sdk-tab[aria-selected="true"] { color: ${selectionFg}; background: ${selection}; border-color: ${border}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${elevatedFg}; background: var(--oc-sdk-raised-bg); border-color: transparent; ${raised} }
.oc-sdk-tab-count { color: ${muted}; }

.oc-sdk-badge { border-radius: 9999px; background: ${hover}; color: ${muted}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${mix("var(--oc-sdk-tone)", 15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${hover}; }
.oc-sdk-row[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-row-lead { font-family: ${mono}; color: ${muted}; }
.oc-sdk-row-sub { color: ${muted}; }
.oc-sdk-row-meta { color: ${muted}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${muted}; }

.oc-sdk-empty-body { color: ${muted}; }

.oc-sdk-spinner { color: ${muted}; }
.oc-sdk-spinner-ring { border-color: ${border}; border-top-color: ${primary}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${mix("var(--oc-sdk-tone)", 10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${muted}; }

.oc-sdk-separator { color: ${muted}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${mix(border, 40)}; }

.oc-sdk-progress-label { color: ${muted}; }
.oc-sdk-progress-track { border-radius: 9999px; background: ${border}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${primary}); }

.oc-sdk-text a { color: ${primaryText}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${mix(border, 60)}; }
`;
  var UI_CSS = `
${GUEST_SCROLLBAR_CSS}
${UI_SIZE_CSS}
${GUEST_UI_LOOK_CSS}`;
  // src/shared/format.ts
  var formatTokens = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value))
      return "—";
    const abs = Math.abs(value);
    if (abs >= 1e6)
      return `${(value / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(".", ",")}M`;
    if (abs >= 1000)
      return `${(value / 1000).toFixed(abs >= 1e5 ? 0 : 1).replace(".", ",")}k`;
    return String(Math.round(value));
  };
  var formatUsd = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value))
      return "—";
    const digits = value > 0 && value < 0.01 ? 5 : value < 1 ? 4 : 2;
    return `US$ ${value.toFixed(digits).replace(".", ",")}`;
  };
  var formatBrl = (usd, rate) => {
    if (usd === null || usd === undefined || !Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) {
      return "—";
    }
    return `R$ ${(usd * rate).toFixed(2).replace(".", ",")}`;
  };
  var formatPercent = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value))
      return "—";
    return `${value.toFixed(value % 1 === 0 ? 0 : 1).replace(".", ",")}%`;
  };
  var formatDuration = (ms) => {
    if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0)
      return "—";
    const total = Math.round(ms / 1000);
    if (total < 60)
      return `${total}s`;
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    if (minutes < 60)
      return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  };
  var formatAge = (now, at) => {
    if (at === null || at === undefined || !Number.isFinite(at))
      return "—";
    const delta = Math.max(0, now - at);
    if (delta < 5000)
      return "agora";
    if (delta < 60000)
      return `há ${Math.round(delta / 1000)}s`;
    if (delta < 3600000)
      return `há ${Math.round(delta / 60000)}m`;
    if (delta < 86400000)
      return `há ${Math.round(delta / 3600000)}h`;
    return `há ${Math.round(delta / 86400000)}d`;
  };
  var shortPath = (path, max = 44) => {
    if (path.length <= max)
      return path;
    const parts = path.split("/");
    let result = parts.at(-1) ?? path;
    for (let index = parts.length - 2;index >= 0; index -= 1) {
      const next = `${parts[index]}/${result}`;
      if (next.length > max)
        break;
      result = next;
    }
    return `…/${result}`;
  };
  var truncate = (value, max) => {
    const clean = value.trim();
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
  };

  // src/shared/strings.ts
  var strings = {
    app: "Lens",
    tabs: {
      overview: "Visão geral",
      agents: "Agentes",
      turns: "Turnos",
      diffs: "Diffs",
      tree: "Árvore",
      inventory: "Inventário"
    },
    empty: {
      noSession: "Nenhuma sessão aberta.",
      noSessionHint: "Abra uma conversa para o Lens acompanhar.",
      noTurns: "Nenhum turno nesta sessão.",
      noAgents: "Nenhum subagente nesta sessão.",
      noDiff: "Nenhum arquivo alterado nesta sessão.",
      noRecent: "Nenhum arquivo tocado ainda.",
      noTree: "Nenhum arquivo neste diretório.",
      noInventory: "Nenhum item encontrado.",
      noHistory: "Coletando histórico…"
    },
    labels: {
      context: "Contexto",
      cost: "Custo",
      costSession: "Custo da sessão",
      tokens: "Tokens",
      input: "Entrada",
      output: "Saída",
      reasoning: "Raciocínio",
      cacheRead: "Cache lido",
      cacheWrite: "Cache escrito",
      model: "Modelo",
      agent: "Agente",
      status: "Status",
      tools: "Ferramentas",
      failures: "Falhas",
      files: "Arquivos",
      lastTurn: "Último turno",
      recentFiles: "Arquivos recentes",
      duration: "Duração",
      request: "Pedido",
      working: "Trabalhando",
      idle: "Parada",
      unknown: "—",
      agentTree: "Quem chamou quem",
      openSession: "Abrir sessão",
      open: "Abrir",
      stop: "Parar",
      stopConfirm: "Confirmar?",
      stopping: "Parando…",
      settings: "Ajustes",
      rate: "Cotação do dólar (R$)",
      save: "Salvar",
      close: "Fechar",
      filter: "Filtrar",
      clearHistory: "Limpar histórico",
      confirmClear: "Confirmar limpeza?",
      history: "Histórico",
      costHistory: "Custo",
      contextHistory: "Contexto",
      parent: "pai",
      start: "Início",
      patchTruncated: "Patch truncado para manter o painel rápido.",
      runningTurn: "Em andamento"
    },
    sections: {
      lastTurn: "Último turno",
      recentFiles: "Arquivos recentes",
      agents: "Subagentes",
      turns: "Turnos",
      diffs: "Arquivos alterados",
      tokens: "Tokens",
      tree: "Projeto",
      inventory: "Instalado",
      history: "Histórico"
    },
    status: {
      running: "rodando",
      completed: "concluído",
      failed: "falhou",
      unknown: "—"
    },
    errors: {
      "no-server": {
        title: "Servidor local não encontrado",
        body: "Abra o OpenChamber no desktop ou inicie um `openchamber serve` local."
      },
      "auth-required": {
        title: "Instância autenticada não suportada",
        body: "O Lens só lê o servidor local sem senha. Instâncias remotas ou protegidas por senha ficam de fora nesta versão."
      },
      "upstream-failed": {
        title: "Falha ao ler a sessão",
        body: "O servidor local respondeu com erro. O Lens tenta de novo no próximo ciclo."
      },
      "bad-answer": {
        title: "Resposta inesperada",
        body: "O servidor local devolveu dados fora do formato esperado."
      },
      "session-not-found": {
        title: "Sessão não encontrada",
        body: "A sessão aberta não está mais disponível no servidor local."
      },
      paused: {
        title: "Lens pausado",
        body: "Ative o Lens em Configurações → Extensões."
      },
      "needs-approval": {
        title: "Serviço local bloqueado",
        body: "Permita o serviço local do Lens em Configurações → Extensões."
      },
      "service-failed": {
        title: "Serviço local parou",
        body: "O serviço reinicia no próximo ciclo do painel."
      },
      unreachable: {
        title: "Serviço local inacessível",
        body: "Não foi possível falar com o serviço do Lens."
      },
      forbidden: {
        title: "Ação não permitida",
        body: "O Lens só interrompe subagentes da sessão atual."
      },
      "not-git": {
        title: "Diretório sem Git",
        body: "A sessão atual não está dentro de um repositório Git."
      }
    }
  };
  var errorText2 = (code) => strings.errors[code] ?? {
    title: "Falha no Lens",
    body: `Código: ${code}`
  };

  // src/shared/view.ts
  var statusTone = (status) => {
    if (status === "running")
      return "normal";
    if (status === "failed")
      return "danger";
    if (status === "completed")
      return "muted";
    return "muted";
  };
  var statusText = (status) => strings.status[status] ?? strings.labels.unknown;
  var contextTone = (percent) => {
    if (percent === null)
      return "muted";
    if (percent >= 90)
      return "danger";
    if (percent >= 70)
      return "warning";
    return "normal";
  };
  var turnRow = (turn) => {
    const meta = [
      { key: "duration", text: formatDuration(turn.durationMs), tone: "muted" },
      { key: "cost", text: formatUsd(turn.cost), tone: "muted" },
      {
        key: "tools",
        text: `${turn.toolCalls} ${turn.toolCalls === 1 ? "ferramenta" : "ferramentas"}`,
        tone: "muted"
      },
      {
        key: "failures",
        text: turn.failures > 0 ? `${turn.failures} ${turn.failures === 1 ? "falha" : "falhas"}` : "sem falhas",
        tone: turn.failures > 0 ? "warning" : "muted"
      }
    ];
    if (turn.agents.length > 0) {
      meta.push({
        key: "agents",
        text: `${turn.agents.length} ${turn.agents.length === 1 ? "agente" : "agentes"}`,
        tone: "muted"
      });
    }
    return {
      index: turn.index,
      request: truncate(turn.request || `Turno ${turn.index}`, 120),
      duration: formatDuration(turn.durationMs),
      cost: formatUsd(turn.cost),
      tools: `${turn.toolCalls} ${turn.toolCalls === 1 ? "ferramenta" : "ferramentas"}`,
      failures: turn.failures > 0 ? `${turn.failures} ${turn.failures === 1 ? "falha" : "falhas"}` : "sem falhas",
      running: turn.running,
      agents: turn.agents.length,
      meta,
      tone: turn.failures > 0 ? "warning" : turn.running ? "normal" : "muted"
    };
  };
  var tabCounts = (snapshot) => ({
    agents: snapshot.agents.filter((agent) => !agent.isMain).length,
    turns: snapshot.turns.length,
    diffs: snapshot.diff.length
  });
  var overviewModel = (snapshot, brlRate = 0) => {
    const { session, counts, recentFiles } = snapshot;
    const now = snapshot.at;
    const contextHint = session.context.used === null ? "sem leitura" : `${formatTokens(session.context.used)} de ${formatTokens(session.context.limit)}`;
    const brl = brlRate > 0 ? ` · ${formatBrl(session.cost, brlRate)}` : "";
    return {
      title: session.title,
      subtitle: `${session.agent} · ${session.model.name}${session.model.variant ? ` · ${session.model.variant}` : ""}`,
      status: statusText(session.status),
      contextPercent: session.context.percent,
      metrics: [
        {
          label: strings.labels.context,
          value: formatPercent(session.context.percent),
          hint: contextHint,
          tone: contextTone(session.context.percent)
        },
        { label: strings.labels.cost, value: formatUsd(session.cost), hint: `${counts.userTurns} turnos${brl}`, tone: "normal" },
        {
          label: strings.labels.tools,
          value: String(counts.toolCalls),
          hint: counts.toolFailures > 0 ? `${counts.toolFailures} falhas` : "sem falhas",
          tone: counts.toolFailures > 0 ? "warning" : "muted"
        },
        {
          label: strings.labels.files,
          value: String(counts.filesChanged),
          hint: counts.assistantMessages + " respostas",
          tone: "muted"
        },
        {
          label: strings.labels.model,
          value: session.model.name,
          hint: session.model.variant ?? undefined,
          tone: "muted"
        },
        {
          label: strings.labels.duration,
          value: formatAge(now, session.createdAt),
          hint: `atualizada ${formatAge(now, session.updatedAt)}`,
          tone: "muted"
        }
      ],
      tokens: [
        { label: strings.labels.input, value: formatTokens(session.tokens.input), tone: "muted" },
        { label: strings.labels.output, value: formatTokens(session.tokens.output), tone: "muted" },
        { label: strings.labels.reasoning, value: formatTokens(session.tokens.reasoning), tone: "muted" },
        { label: strings.labels.cacheRead, value: formatTokens(session.tokens.cacheRead), tone: "muted" },
        { label: strings.labels.cacheWrite, value: formatTokens(session.tokens.cacheWrite), tone: "muted" }
      ],
      lastTurn: snapshot.turns.length > 0 ? turnRow(snapshot.turns[snapshot.turns.length - 1]) : null,
      recentFiles: recentFiles.map((file) => ({
        path: shortPath(file.path, 46),
        action: file.action === "edit" ? "editado" : "lido",
        age: formatAge(now, file.at)
      }))
    };
  };
  var agentRows = (snapshot) => snapshot.agents.map((agent) => {
    const parent = agent.parentId ? snapshot.agents.find((candidate) => candidate.id === agent.parentId) : null;
    return {
      id: agent.id,
      title: agent.title,
      parentTitle: parent?.title ?? null,
      depth: agent.depth,
      isMain: agent.isMain,
      model: agent.model,
      status: statusText(agent.status),
      tone: statusTone(agent.status),
      cost: formatUsd(agent.cost),
      tokens: formatTokens(agent.tokens.input + agent.tokens.output + agent.tokens.reasoning + agent.tokens.cacheRead),
      tools: `${agent.toolCalls}`,
      canOpen: !agent.isMain,
      canStop: !agent.isMain && agent.status === "running"
    };
  });
  var turnRows = (snapshot) => snapshot.turns.map(turnRow);
  var diffRowsFromFiles = (files) => files.map((file) => ({
    path: shortPath(file.path, 52),
    fullPath: file.path,
    status: file.status === "added" ? "novo" : file.status === "deleted" ? "apagado" : file.status === "modified" ? "alterado" : "—",
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
    truncated: file.truncated,
    ...file.note ? { note: file.note } : {},
    tone: file.status === "deleted" ? "danger" : file.status === "added" ? "normal" : "muted"
  }));
  var diffRows = (snapshot) => diffRowsFromFiles(snapshot.diff);

  // src/panel/client.ts
  var failureOf = (error) => {
    if (error instanceof HostRequestError) {
      switch (error.code) {
        case "NO_SERVICE":
        case "NOT_GRANTED":
          return { code: "needs-approval", message: error.message };
        case "DISABLED":
          return { code: "paused", message: error.message };
        case "SERVICE_FAILED":
          return { code: "service-failed", message: error.message };
        case "HOST_UNAVAILABLE":
        case "HOST_TIMEOUT":
        case "DISCONNECTED":
          return { code: "unreachable", message: error.message };
        default:
          return { code: "unreachable", message: error.message };
      }
    }
    return { code: "unreachable", message: error instanceof Error ? error.message : "Falha inesperada." };
  };
  var parse = (body) => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.error)
        return { data: null, error: parsed.error };
      if (parsed.data === null || parsed.data === undefined) {
        return { data: null, error: { code: "bad-answer", message: "Resposta sem dados." } };
      }
      return { data: parsed.data, error: null };
    } catch {
      return { data: null, error: { code: "bad-answer", message: "Resposta não é JSON." } };
    }
  };
  var requestSnapshot = async (host, sessionId) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/snapshot",
        query: { sessionId }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestGitDiff = async (host, sessionId) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/git-diff",
        query: { sessionId }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestTurnDiff = async (host, sessionId, turn) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/turn-diff",
        query: { sessionId, turn: String(turn) }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestInterrupt = async (host, sessionId, parentId) => {
    try {
      const result = await host.serviceRequest({
        method: "POST",
        path: "/interrupt",
        body: JSON.stringify({ sessionId, parentId })
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestTree = async (host, sessionId, path) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/tree",
        query: { sessionId, ...path ? { path } : {} }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestInventory = async (host, sessionId) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/inventory",
        query: { sessionId }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var requestHistory = async (host, sessionId) => {
    try {
      const result = await host.serviceRequest({
        method: "GET",
        path: "/history",
        query: { sessionId, limit: "500" }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };
  var clearHistory = async (host, sessionId) => {
    try {
      const result = await host.serviceRequest({
        method: "DELETE",
        path: "/history",
        query: { sessionId }
      });
      return parse(result.body);
    } catch (error) {
      return { data: null, error: failureOf(error) };
    }
  };

  // src/panel/dom.ts
  var el2 = (tag, className, children, text) => {
    const node = document.createElement(tag);
    if (className)
      node.className = className;
    if (text !== undefined)
      node.textContent = text;
    const list = Array.isArray(children) ? children : children === undefined ? [] : [children];
    for (const child of list) {
      if (child === null || child === undefined || child === false)
        continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  };

  // src/panel/render.ts
  var TABS = [
    { id: "overview", label: strings.tabs.overview },
    { id: "agents", label: strings.tabs.agents },
    { id: "turns", label: strings.tabs.turns },
    { id: "diffs", label: strings.tabs.diffs },
    { id: "tree", label: strings.tabs.tree },
    { id: "inventory", label: strings.tabs.inventory }
  ];
  var svgIcon = (paths, size = 12) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.4");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.append(path);
    }
    return svg;
  };
  var chevron = (open) => {
    const icon2 = svgIcon(["M6 4l4 4-4 4"]);
    icon2.classList.add("turn-chevron");
    if (open)
      icon2.classList.add("open");
    return icon2;
  };
  var statusPill = (label, tone2) => {
    const pill = el2("span", "lens-status");
    pill.append(el2("span", `status-dot ${tone2}`), el2("span", undefined, label));
    return pill;
  };
  var empty = (title, body) => el2("div", "empty", [
    el2("div", "empty-title", undefined, title),
    body ? el2("div", "empty-body", undefined, body) : null
  ]);
  var header = (props) => {
    const session = props.snapshot?.session;
    const title = session?.title ?? strings.app;
    const subtitle = session ? `${session.agent} · ${session.model.name}${session.model.variant ? ` · ${session.model.variant}` : ""}` : props.hasSession ? "Lendo sessão…" : strings.empty.noSessionHint;
    const tone2 = session?.status === "running" ? "normal" : session?.status === "failed" ? "danger" : "muted";
    const statusLabel = session ? strings.status[session.status] ?? strings.labels.unknown : "";
    const settings = el2("button", "lens-settings-toggle", undefined, strings.labels.settings);
    settings.type = "button";
    settings.addEventListener("click", () => props.onSettings());
    return el2("div", "lens-header", [
      el2("div", "lens-header-main", [
        el2("div", "lens-title", undefined, title),
        el2("div", "lens-sub", undefined, subtitle)
      ]),
      session ? statusPill(statusLabel, tone2) : null,
      settings
    ]);
  };
  var tabCount = (snapshot, id) => {
    if (!snapshot)
      return null;
    const counts = tabCounts(snapshot);
    if (id === "agents")
      return counts.agents;
    if (id === "turns")
      return counts.turns;
    if (id === "diffs")
      return counts.diffs;
    return null;
  };
  var tabs = (props) => {
    const bar = el2("div", "lens-tabs");
    for (const tab of TABS) {
      const node = el2("button", `lens-tab ${props.tab === tab.id ? "active" : ""}`);
      node.type = "button";
      node.setAttribute("aria-pressed", String(props.tab === tab.id));
      node.append(el2("span", undefined, tab.label));
      const count = tabCount(props.snapshot, tab.id);
      if (count !== null && count > 0) {
        node.append(el2("span", "lens-tab-count", String(count)));
      }
      node.addEventListener("click", () => props.onTab(tab.id));
      bar.append(node);
    }
    return bar;
  };
  var sectionBar = (number, label, count) => {
    const bar = el2("div", "section-bar");
    bar.append(el2("span", "section-number", String(number).padStart(2, "0")), el2("span", "section-label", label));
    if (count !== undefined)
      bar.append(el2("span", "section-count", String(count)));
    return bar;
  };
  var section = (number, label, content, count) => el2("div", "lens-section", [sectionBar(number, label, count), content]);
  var statCard = (metric) => {
    const card = el2("div", "stat-card", [
      el2("div", "stat-label", undefined, metric.label),
      el2("div", `stat-value ${metric.tone}`, undefined, metric.value),
      metric.hint ? el2("div", "stat-hint", undefined, metric.hint) : null
    ]);
    if (metric.label === strings.labels.duration)
      card.classList.add("duration-card");
    if (metric.label === strings.labels.model)
      card.classList.add("model-card");
    return card;
  };
  var contextCard = (snapshot, metric) => {
    const { percent, used, limit } = snapshot.session.context;
    const fill = el2("div", `context-fill ${metric.tone}`);
    fill.style.transform = `scaleX(${Math.max(0, Math.min(100, percent ?? 0)) / 100})`;
    const meter = el2("div", "context-meter");
    meter.append(fill);
    return el2("div", "stat-card context-card", [
      el2("div", "stat-label", undefined, metric.label),
      el2("div", `stat-value ${metric.tone}`, undefined, metric.value),
      meter,
      el2("div", "context-meta", [el2("span", undefined, metric.hint ?? "sem leitura")])
    ]);
  };
  var tokenCard = (tokens) => {
    const grid = el2("div", "token-grid");
    for (const token of tokens) {
      grid.append(el2("div", "token-item", [
        el2("div", "stat-label", undefined, token.label),
        el2("div", "token-value", undefined, token.value)
      ]));
    }
    return el2("div", "stat-card token-card", [el2("div", "stat-label", undefined, strings.labels.tokens), grid]);
  };
  var metaList = (items, className = "turn-meta") => {
    const wrap = el2("div", className);
    items.forEach((item, index) => {
      if (index > 0)
        wrap.append(el2("span", "meta-sep", "·"));
      wrap.append(el2("span", `meta-${item.tone}`, item.text));
    });
    return wrap;
  };
  var lastTurnCard = (turn) => el2("div", "panel-card turn-summary", [
    el2("div", "turn-summary-request", undefined, turn.request),
    metaList(turn.meta)
  ]);
  var recentFiles = (files) => {
    if (files.length === 0)
      return empty(strings.empty.noRecent);
    const card = el2("div", "panel-card");
    for (const file of files) {
      card.append(el2("div", "list-row", [
        el2("div", "list-main", [
          el2("div", "list-path", undefined, file.path),
          el2("div", "list-meta", undefined, file.action)
        ]),
        el2("div", "list-age", undefined, file.age)
      ]));
    }
    return card;
  };
  var sparkline = (values, tone2) => {
    const width = 200;
    const height = 32;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = values.length > 1 ? width / (values.length - 1) : width;
    const points = values.map((value, index) => `${index * step},${height - 3 - (value - min) / span * (height - 6)}`).join(" ");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("sparkline", tone2);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", points);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "1.6");
    line.setAttribute("stroke-linejoin", "round");
    line.setAttribute("stroke-linecap", "round");
    svg.append(line);
    return svg;
  };
  var historySection = (points, props) => {
    if (points.length < 2) {
      return section(3, strings.sections.history, empty(strings.empty.noHistory));
    }
    const costValues = points.map((point) => point.cost);
    const contextValues = points.map((point) => point.contextPercent).filter((value) => value !== null);
    const last = points[points.length - 1];
    const row = (label, value, chart) => el2("div", "history-row", [
      el2("div", "history-label", undefined, label),
      chart ?? el2("div", "history-empty", undefined, "—"),
      el2("div", "history-value", undefined, value)
    ]);
    const card = el2("div", "panel-card history-card", [
      row(strings.labels.costHistory, formatUsd(last.cost), sparkline(costValues, "normal")),
      contextValues.length > 1 ? row(strings.labels.contextHistory, formatPercent(contextValues[contextValues.length - 1]), sparkline(contextValues, "muted")) : null
    ]);
    const clear = el2("button", "lens-small", undefined, props.confirmingClear ? strings.labels.confirmClear : strings.labels.clearHistory);
    clear.type = "button";
    clear.addEventListener("click", () => props.onClearHistory());
    card.append(clear);
    return section(3, strings.sections.history, card, points.length);
  };
  var overview = (snapshot, props) => {
    const model = overviewModel(snapshot, props.brlRate);
    const context = model.metrics[0];
    const cards = model.metrics.slice(1).map(statCard);
    const grid = el2("div", "lens-grid");
    if (context)
      grid.append(contextCard(snapshot, context));
    grid.append(...cards);
    return el2("div", undefined, [
      grid,
      tokenCard(model.tokens),
      section(1, strings.sections.lastTurn, model.lastTurn ? lastTurnCard(model.lastTurn) : empty(strings.empty.noTurns)),
      section(2, strings.sections.recentFiles, recentFiles(model.recentFiles)),
      historySection(props.history.points, props)
    ]);
  };
  var agentIcon = (main) => main ? svgIcon(["M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z", "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"]) : svgIcon(["M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3Z", "M5.5 8h5"]);
  var agentCard = (row, props) => {
    const card = el2("div", `agent-card ${row.canOpen ? "clickable" : ""}`);
    card.style.marginLeft = `${row.depth * 10}px`;
    const avatar = el2("span", `agent-avatar ${row.tone}`);
    avatar.append(agentIcon(row.isMain));
    const head = el2("div", "agent-head", [
      el2("span", "agent-title", undefined, row.title),
      el2("span", `status-dot ${row.tone}`),
      el2("span", "muted", undefined, row.status)
    ]);
    const meta = el2("div", "agent-meta");
    if (row.parentTitle)
      meta.append(el2("span", undefined, `${strings.labels.parent}: ${row.parentTitle}`));
    meta.append(el2("span", undefined, row.model));
    const figures = el2("div", "agent-figures", [
      el2("span", undefined, [el2("b", undefined, undefined, row.cost), " custo"]),
      el2("span", undefined, [el2("b", undefined, undefined, row.tokens), " tokens"]),
      el2("span", undefined, [el2("b", undefined, undefined, row.tools), " ferramentas"])
    ]);
    const body = el2("div", "agent-body", [head, meta, figures]);
    card.append(avatar, body);
    if (row.canStop) {
      const stop = el2("button", "agent-stop");
      stop.type = "button";
      stop.textContent = props.stoppingAgents.has(row.id) ? strings.labels.stopping : props.confirmingStop === row.id ? strings.labels.stopConfirm : strings.labels.stop;
      stop.disabled = props.stoppingAgents.has(row.id);
      stop.addEventListener("click", (event) => {
        event.stopPropagation();
        props.onStopAgent(row.id);
      });
      card.append(stop);
    }
    if (row.canOpen) {
      const open = el2("button", "agent-open", undefined, strings.labels.open);
      open.type = "button";
      open.addEventListener("click", (event) => {
        event.stopPropagation();
        props.onOpenAgent(row.id);
      });
      card.append(open);
      card.addEventListener("click", () => props.onOpenAgent(row.id));
    }
    return card;
  };
  var agents = (snapshot, props) => {
    const rows = agentRows(snapshot);
    const children = rows.filter((row) => !row.isMain);
    const content = children.length === 0 ? empty(strings.empty.noAgents) : el2("div", undefined, children.map((row) => agentCard(row, props)));
    return section(1, strings.sections.agents, content, children.length);
  };
  var turnCard = (row, snapshot, props) => {
    const turn = snapshot.turns.find((entry) => entry.index === row.index);
    const open = props.expandedTurns.has(row.index);
    const card = el2("div", "turn-card");
    const head = el2("button", "turn-head");
    head.type = "button";
    head.setAttribute("aria-expanded", String(open));
    const body = el2("div", "list-main", [
      el2("div", "turn-request", undefined, row.request),
      metaList(row.meta)
    ]);
    head.append(el2("span", "turn-index", undefined, `#${row.index}`), body);
    if (row.running) {
      const state = el2("span", "turn-state");
      state.append(el2("span", "status-dot normal"), el2("span", undefined, strings.labels.runningTurn));
      head.append(state);
    }
    head.append(chevron(open));
    head.addEventListener("click", () => props.onToggleTurn(row.index));
    card.append(head);
    if (open && turn) {
      const agentsText = turn.agents.map((id) => snapshot.agents.find((agent) => agent.id === id)?.title ?? id).join(", ");
      const tokens = turn.tokens.input + turn.tokens.output + turn.tokens.reasoning + turn.tokens.cacheRead + turn.tokens.cacheWrite;
      const detail = el2("div", "turn-detail", [
        el2("div", "detail-item detail-full", [
          el2("div", "detail-label", undefined, strings.labels.request),
          el2("div", "detail-value", undefined, turn.request || "—")
        ]),
        el2("div", "detail-item", [
          el2("div", "detail-label", undefined, strings.labels.tools),
          el2("div", "detail-value", undefined, `${turn.toolCalls} ferramentas · ${turn.failures} falhas`)
        ]),
        el2("div", "detail-item", [
          el2("div", "detail-label", undefined, strings.labels.agentTree),
          el2("div", "detail-value", undefined, agentsText || "—")
        ]),
        el2("div", "detail-item", [
          el2("div", "detail-label", undefined, strings.labels.start),
          el2("div", "detail-value", undefined, new Date(turn.startedAt).toLocaleTimeString("pt-BR"))
        ]),
        el2("div", "detail-item", [
          el2("div", "detail-label", undefined, strings.labels.tokens),
          el2("div", "detail-value", undefined, formatTokens(tokens))
        ])
      ]);
      card.append(detail);
    }
    return card;
  };
  var turns = (snapshot, props) => {
    const rows = turnRows(snapshot);
    const content = rows.length === 0 ? empty(strings.empty.noTurns) : el2("div", undefined, rows.map((row) => turnCard(row, snapshot, props)));
    return section(1, strings.sections.turns, content, rows.length);
  };
  var patchLines = (patch) => {
    const wrap = el2("div", "patch");
    for (const line of patch.split(`
`)) {
      const kind = line === "…" ? "meta" : line.startsWith("diff --git") || line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ") ? "meta" : line.startsWith("@@") ? "hunk" : line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : "context";
      wrap.append(el2("div", `patch-line ${kind}`, undefined, line.length > 0 ? line : " "));
    }
    return wrap;
  };
  var diffCard = (row, props) => {
    const open = props.expandedDiffs.has(row.fullPath);
    const card = el2("div", "diff-card");
    const head = el2("button", "diff-head");
    head.type = "button";
    head.setAttribute("aria-expanded", String(open));
    const status = el2("span", `diff-badge ${row.tone}`, undefined, row.status);
    const counts = el2("span", "diff-counts", [
      el2("span", "add", undefined, `+${row.additions}`),
      el2("span", "del", undefined, `−${row.deletions}`)
    ]);
    head.append(el2("span", "diff-path", undefined, row.path), status, counts, chevron(open));
    head.addEventListener("click", () => props.onToggleDiff(row.fullPath));
    card.append(head);
    if (open) {
      if (row.note)
        card.append(el2("div", "diff-note", undefined, row.note));
      card.append(patchLines(row.patch));
      if (row.truncated)
        card.append(el2("div", "truncated", undefined, strings.labels.patchTruncated));
    }
    return card;
  };
  var tree = (snapshot, props) => {
    const view = props.tree;
    const touched = new Set(snapshot.recentFiles.map((file) => file.path));
    const changed = new Map(snapshot.diff.map((file) => [file.path.replace(/^\.\//, ""), file.status]));
    const rows = [];
    const walk = (key, depth) => {
      for (const entry of view.entries[key] ?? []) {
        const isDirectory = entry.kind === "directory";
        const open = view.expanded.has(entry.relative);
        const row = isDirectory ? el2("button", "tree-row directory") : el2("div", "tree-row");
        if (isDirectory) {
          row.type = "button";
          row.addEventListener("click", () => props.onTreeToggle(entry.relative));
        }
        row.style.paddingLeft = `${6 + depth * 12}px`;
        if (isDirectory) {
          const marker = chevron(open);
          marker.classList.add("tree-chevron");
          row.append(marker);
        } else {
          const icon2 = svgIcon(["M4 2h5l3 3v9H4z", "M9 2v3h3"]);
          icon2.classList.add("tree-icon");
          row.append(icon2);
        }
        row.append(el2("span", "tree-name", undefined, entry.name));
        if (touched.has(entry.path))
          row.append(el2("span", "tree-touched"));
        const gitStatus = entry.gitStatus === "A" ? "added" : entry.gitStatus === "D" ? "deleted" : entry.gitStatus ? "modified" : changed.get(entry.relative);
        if (gitStatus) {
          const letter = gitStatus === "added" ? "A" : gitStatus === "deleted" ? "D" : gitStatus === "modified" ? "M" : "";
          if (letter)
            row.append(el2("span", `tree-git ${gitStatus}`, undefined, letter));
        }
        rows.push(row);
        if (isDirectory && open)
          walk(entry.relative, depth + 1);
      }
    };
    if (view.entries["."])
      walk(".", 0);
    let content;
    if (view.error) {
      content = el2("div", "banner error", [
        el2("div", "banner-title", undefined, "Falha ao ler a árvore"),
        el2("div", "banner-body", undefined, view.error)
      ]);
    } else if (view.loading && rows.length === 0) {
      content = empty("Lendo arquivos…");
    } else if (rows.length === 0) {
      content = empty(strings.empty.noTree);
    } else {
      content = el2("div", "panel-card", [
        view.root ? el2("div", "tree-root", undefined, view.root) : null,
        ...rows
      ]);
    }
    return section(1, strings.sections.tree, content, rows.length);
  };
  var inventory = (props) => {
    const view = props.inventory;
    const filter = view.filter.trim().toLowerCase();
    const sections = (view.data?.sections ?? []).map((section2) => ({
      ...section2,
      items: section2.items.filter((item) => filter === "" ? true : `${item.name} ${item.description} ${item.meta} ${item.status}`.toLowerCase().includes(filter))
    }));
    const total = sections.reduce((sum, section2) => sum + section2.items.length, 0);
    const input = el2("input", "inventory-filter");
    input.type = "search";
    input.placeholder = strings.labels.filter;
    input.value = view.filter;
    input.addEventListener("input", () => props.onInventoryFilter(input.value));
    let content;
    if (view.error) {
      content = el2("div", "banner error", [
        el2("div", "banner-title", undefined, "Falha ao ler o inventário"),
        el2("div", "banner-body", undefined, view.error)
      ]);
    } else if (view.loading && !view.data) {
      content = empty("Lendo inventário…");
    } else if (total === 0) {
      content = empty(strings.empty.noInventory);
    } else {
      const list = el2("div", undefined);
      for (const section2 of sections) {
        if (section2.items.length === 0)
          continue;
        const rows = el2("div", "panel-card");
        for (const item of section2.items) {
          rows.append(el2("div", "inventory-item", [
            el2("div", "inventory-body", [
              el2("div", "inventory-name", undefined, item.name),
              item.description ? el2("div", "inventory-desc", undefined, item.description) : null,
              item.meta ? el2("div", "inventory-meta", undefined, item.meta) : null
            ]),
            el2("span", `diff-badge ${item.tone}`, undefined, item.status)
          ]));
        }
        list.append(el2("div", "inventory-section", [
          el2("div", "inventory-head", [
            el2("span", "section-label", undefined, section2.label),
            el2("span", "inventory-count", undefined, String(section2.items.length))
          ]),
          rows
        ]));
      }
      content = list;
    }
    return el2("div", undefined, [input, section(1, strings.sections.inventory, content, total)]);
  };
  var settingsCard = (props) => {
    const input = el2("input", "settings-input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.placeholder = "5,22";
    input.value = props.brlInput;
    input.addEventListener("input", () => props.onBrlInput(input.value));
    const save = el2("button", "lens-small", undefined, strings.labels.save);
    save.type = "button";
    save.addEventListener("click", () => props.onSaveSettings());
    const close = el2("button", "lens-small", undefined, strings.labels.close);
    close.type = "button";
    close.addEventListener("click", () => props.onSettings());
    return el2("div", "settings-card", [
      el2("div", "stat-label", undefined, strings.labels.rate),
      el2("div", "settings-row", [input, save, close]),
      el2("div", "settings-hint", undefined, "Cotação manual; 0 desliga o valor em reais.")
    ]);
  };
  var diffs = (snapshot, props) => {
    const view = props.diffView;
    const rows = view.rows ?? diffRows(snapshot);
    const tools = el2("div", "diff-tools");
    const source = el2("div", "diff-source");
    for (const [id, label] of [
      ["session", "Sessão"],
      ["turn", "Turno"],
      ["git", "Git"]
    ]) {
      const button2 = el2("button", `diff-source-item ${view.source === id ? "active" : ""}`, undefined, label);
      button2.type = "button";
      button2.setAttribute("aria-pressed", String(view.source === id));
      button2.addEventListener("click", () => props.onDiffSource(id));
      source.append(button2);
    }
    tools.append(source);
    if (view.source === "turn" && view.turnOptions.length > 0) {
      const select = el2("select", "diff-turn-select");
      select.setAttribute("aria-label", "Turno");
      for (const option of view.turnOptions) {
        const node = el2("option", undefined, undefined, option.label);
        node.value = String(option.index);
        node.selected = option.index === view.selectedTurn;
        select.append(node);
      }
      select.addEventListener("change", () => props.onSelectTurn(Number(select.value)));
      tools.append(select);
    }
    tools.append(el2("span", "diff-meta", view.meta));
    let content;
    if (view.loading) {
      content = empty("Lendo diff…");
    } else if (view.error) {
      content = el2("div", "banner error", [
        el2("div", "banner-title", undefined, "Falha ao ler o diff"),
        el2("div", "banner-body", undefined, view.error)
      ]);
    } else if (rows.length === 0) {
      content = empty(strings.empty.noDiff);
    } else {
      content = el2("div", undefined, rows.map((row) => diffCard(row, props)));
    }
    return el2("div", undefined, [tools, section(1, strings.sections.diffs, content, rows.length)]);
  };
  var errorBanner = (props) => {
    if (!props.error)
      return null;
    const copy = errorText2(props.error.code);
    const body = props.snapshot ? `${copy.body} Os números abaixo podem estar desatualizados.` : copy.body;
    return el2("div", "banner error", [
      el2("div", "banner-title", undefined, copy.title),
      el2("div", "banner-body", undefined, body)
    ]);
  };
  var renderPanel = (root, props) => {
    root.replaceChildren();
    root.append(header(props));
    if (props.settingsOpen)
      root.append(settingsCard(props));
    if (!props.hasSession) {
      root.append(empty(strings.empty.noSession, strings.empty.noSessionHint));
      return;
    }
    root.append(tabs(props));
    const banner = errorBanner(props);
    if (banner)
      root.append(banner);
    if (!props.snapshot) {
      root.append(empty(props.error ? "Sem dados" : "Lendo sessão…"));
      return;
    }
    if (props.tab === "overview")
      root.append(overview(props.snapshot, props));
    else if (props.tab === "agents")
      root.append(agents(props.snapshot, props));
    else if (props.tab === "turns")
      root.append(turns(props.snapshot, props));
    else if (props.tab === "diffs")
      root.append(diffs(props.snapshot, props));
    else if (props.tab === "tree")
      root.append(tree(props.snapshot, props));
    else
      root.append(inventory(props));
  };

  // src/panel/styles.ts
  var LENS_TOKENS = `
:root {
  color-scheme: light dark;
  --lens-bg: var(--oc-bg, #0b0f14);
  --lens-surface: var(--oc-elevated, #12171d);
  --lens-surface-2: var(--oc-muted-surface, #161b22);
  --lens-border: var(--oc-border, #2a323d);
  --lens-text: var(--oc-fg, #e6edf3);
  --lens-muted: var(--oc-muted, #8b949e);
  --lens-accent: var(--oc-primary, #2f81f7);
  --lens-accent-text: var(--oc-primary-text, #58a6ff);
  --lens-accent-fg: var(--oc-primary-fg, #ffffff);
  --lens-ok: var(--oc-success, #3fb950);
  --lens-ok-text: var(--oc-success-text, #3fb950);
  --lens-warn: var(--oc-warning, #d29922);
  --lens-warn-text: var(--oc-warning-text, #d29922);
  --lens-danger: var(--oc-error, #f85149);
  --lens-danger-text: var(--oc-error-text, #f85149);
  --lens-info: var(--oc-info, #58a6ff);
  --lens-mono: var(--oc-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  --lens-radius: var(--oc-radius, 8px);
  --lens-pad: 16px;
}
* { box-sizing: border-box; }
::selection { background: color-mix(in srgb, var(--lens-accent) 30%, transparent); }
:focus-visible { outline: 2px solid var(--lens-accent); outline-offset: 2px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--lens-muted); flex: 0 0 auto; }
.status-dot.normal { background: var(--lens-ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-ok) 14%, transparent); }
.status-dot.warning { background: var(--lens-warn); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-warn) 14%, transparent); }
.status-dot.danger { background: var(--lens-danger); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lens-danger) 14%, transparent); }
.status-dot.muted { background: var(--lens-muted); }
`;
  var PANEL_STYLE = `${LENS_TOKENS}
html, body {
  margin: 0;
  height: 100%;
  background: var(--lens-bg);
  color: var(--lens-text);
  font-family: var(--oc-font, system-ui, sans-serif);
  font-size: 12px;
  line-height: 1.45;
}
#root {
  height: 100%;
  overflow: auto;
  padding: var(--lens-pad);
  scrollbar-width: thin;
  scrollbar-color: var(--lens-border) transparent;
}
#root::-webkit-scrollbar { width: 8px; height: 8px; }
#root::-webkit-scrollbar-thumb { background: var(--lens-border); border-radius: 999px; }
#root::-webkit-scrollbar-track { background: transparent; }

.lens-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.lens-header-main { flex: 1; min-width: 0; }
.lens-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: var(--lens-text);
  overflow-wrap: anywhere;
}
.lens-sub {
  margin-top: 2px;
  color: var(--lens-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lens-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  background: var(--lens-surface);
  color: var(--lens-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.lens-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}
.lens-tabs::-webkit-scrollbar { display: none; }
.lens-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  background: var(--lens-surface);
  color: var(--lens-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}
.lens-tab:hover { color: var(--lens-text); background: var(--lens-surface-2); }
.lens-tab.active {
  border-color: transparent;
  background: var(--lens-accent);
  color: var(--lens-accent-fg);
}
.lens-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 14%, transparent);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.lens-tab.active .lens-tab-count { background: color-mix(in srgb, var(--lens-accent-fg) 22%, transparent); }
.lens-settings-toggle {
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.lens-settings-toggle:hover { color: var(--lens-text); border-color: var(--lens-accent); }
.settings-card {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
}
.settings-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.settings-input {
  width: 100px;
  padding: 4px 6px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-bg);
  color: var(--lens-text);
  font: inherit;
  font-size: 11px;
}
.settings-hint { color: var(--lens-muted); font-size: 10px; }
.lens-small {
  justify-self: start;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.lens-small:hover { color: var(--lens-text); border-color: var(--lens-accent); }

.lens-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.stat-card {
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
}
.stat-label {
  color: var(--lens-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.stat-value {
  margin-top: 3px;
  color: var(--lens-text);
  font-size: 22px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-value.normal { color: var(--lens-accent-text); }
.stat-value.warning { color: var(--lens-warn-text); }
.stat-value.danger { color: var(--lens-danger-text); }
.stat-value.muted { color: var(--lens-text); }
.model-card .stat-value {
  font-size: 16px;
  line-height: 1.25;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  overflow-wrap: anywhere;
}
.stat-hint {
  margin-top: 2px;
  color: var(--lens-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.context-card { grid-column: 1 / -1; }
.duration-card { grid-column: 1 / -1; }
.context-meter {
  height: 4px;
  margin-top: 9px;
  border-radius: 999px;
  background: var(--lens-border);
  overflow: hidden;
}
.context-fill { width: 100%; height: 100%; transform-origin: left center; transform: scaleX(0); border-radius: inherit; background: var(--lens-accent); transition: transform 200ms ease; }
.context-fill.normal { background: var(--lens-accent); }
.context-fill.warning { background: var(--lens-warn); }
.context-fill.danger { background: var(--lens-danger); }
.context-fill.muted { background: var(--lens-muted); }
.context-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  color: var(--lens-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.token-card { grid-column: 1 / -1; }
.token-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 7px; }
.token-value { margin-top: 1px; font-size: 14px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--lens-text); }

.lens-section { display: flex; flex-direction: column; gap: 7px; margin-top: 14px; }
.section-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 9px 4px 7px;
  border: 1px solid color-mix(in srgb, var(--lens-accent) 20%, var(--lens-border));
  border-left: 1px solid var(--lens-accent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--lens-accent) 7%, var(--lens-surface));
}
.section-number {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid color-mix(in srgb, var(--lens-warn) 75%, var(--lens-border));
  border-radius: 50%;
  color: var(--lens-warn-text);
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.section-label { font-size: 12px; font-weight: 600; color: var(--lens-text); }
.section-count { margin-left: auto; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }

.panel-card {
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  overflow: hidden;
}
.list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 65%, transparent);
}
.list-row:last-child { border-bottom: 0; }
.list-main { flex: 1; min-width: 0; }
.list-path {
  font-family: var(--lens-mono);
  font-size: 11px;
  color: var(--lens-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list-meta { margin-top: 1px; color: var(--lens-muted); font-size: 10px; }
.list-age { color: var(--lens-muted); font-size: 10px; white-space: nowrap; font-variant-numeric: tabular-nums; }

.turn-summary { padding: 10px 11px; }
.turn-summary-request { font-size: 12px; font-weight: 600; color: var(--lens-text); overflow-wrap: anywhere; }
.turn-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px; margin-top: 3px; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.meta-sep { color: color-mix(in srgb, var(--lens-muted) 55%, transparent); }
.meta-warning { color: var(--lens-warn-text); }
.meta-danger { color: var(--lens-danger-text); }
.meta-normal { color: var(--lens-accent-text); }
.meta-muted { color: var(--lens-muted); }

.agent-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  margin-bottom: 6px;
}
.agent-card:last-child { margin-bottom: 0; }
.agent-card.clickable { cursor: pointer; transition: border-color 150ms ease, background 150ms ease; }
.agent-card.clickable:hover { border-color: color-mix(in srgb, var(--lens-accent) 45%, var(--lens-border)); background: var(--lens-surface-2); }
.agent-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: 1px solid var(--lens-border);
  border-radius: 50%;
  color: var(--lens-muted);
  background: var(--lens-surface-2);
}
.agent-avatar.normal { border-color: color-mix(in srgb, var(--lens-ok) 55%, var(--lens-border)); color: var(--lens-ok-text); }
.agent-avatar.warning { border-color: color-mix(in srgb, var(--lens-warn) 55%, var(--lens-border)); color: var(--lens-warn-text); }
.agent-avatar.danger { border-color: color-mix(in srgb, var(--lens-danger) 55%, var(--lens-border)); color: var(--lens-danger-text); }
.agent-body { flex: 1; min-width: 0; }
.agent-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agent-title { font-size: 12px; font-weight: 600; color: var(--lens-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.agent-meta { display: flex; flex-wrap: wrap; gap: 3px 7px; margin-top: 2px; color: var(--lens-muted); font-size: 10px; }
.agent-figures { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 4px; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.agent-figures b { color: var(--lens-text); font-weight: 600; }
.agent-open {
  align-self: center;
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.agent-open:hover { color: var(--lens-text); border-color: var(--lens-accent); }
.agent-stop {
  align-self: center;
  flex: 0 0 auto;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--lens-danger) 40%, var(--lens-border));
  border-radius: 6px;
  background: transparent;
  color: var(--lens-danger-text);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.agent-stop:hover { background: color-mix(in srgb, var(--lens-danger) 10%, transparent); }
.agent-stop:disabled { opacity: .65; cursor: default; }

.turn-card { border: 1px solid var(--lens-border); border-radius: var(--lens-radius); background: var(--lens-surface); margin-bottom: 6px; overflow: hidden; }
.turn-card:last-child { margin-bottom: 0; }
.turn-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.turn-head:hover { background: var(--lens-surface-2); }
.turn-index {
  flex: 0 0 auto;
  min-width: 20px;
  padding-top: 1px;
  color: var(--lens-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.turn-request { flex: 1; min-width: 0; font-size: 12px; font-weight: 600; color: var(--lens-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.turn-chevron { flex: 0 0 auto; color: var(--lens-muted); transition: transform 150ms ease; }
.turn-chevron.open { transform: rotate(90deg); }
.turn-state { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; color: var(--lens-muted); font-size: 10px; white-space: nowrap; }
.turn-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 14px;
  padding: 10px;
  border-top: 1px solid var(--lens-border);
  background: var(--lens-surface-2);
}
.detail-item { min-width: 0; }
.detail-label { color: var(--lens-muted); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.detail-value { margin-top: 2px; color: var(--lens-text); font-size: 11px; overflow-wrap: anywhere; }
.detail-full { grid-column: 1 / -1; }

.diff-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
.diff-source { display: inline-flex; padding: 2px; border: 1px solid var(--lens-border); border-radius: 999px; background: var(--lens-surface); }
.diff-source button {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--lens-muted);
  font: inherit;
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
}
.diff-source button.active { background: var(--lens-accent); color: var(--lens-accent-fg); }
.diff-turn-select {
  max-width: 100%;
  padding: 3px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-surface);
  color: var(--lens-text);
  font: inherit;
  font-size: 10px;
}
.diff-meta { margin-left: auto; color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.diff-card { border: 1px solid var(--lens-border); border-radius: var(--lens-radius); background: var(--lens-surface); margin-bottom: 6px; overflow: hidden; }.diff-card:last-child { margin-bottom: 0; }
.diff-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.diff-head:hover { background: var(--lens-surface-2); }
.diff-path {
  flex: 1;
  min-width: 0;
  font-family: var(--lens-mono);
  font-size: 11px;
  color: var(--lens-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diff-badge {
  flex: 0 0 auto;
  padding: 1px 5px;
  border: 1px solid var(--lens-border);
  border-radius: 999px;
  color: var(--lens-muted);
  font-size: 9px;
  white-space: nowrap;
}
.diff-badge.normal { color: var(--lens-ok-text); border-color: color-mix(in srgb, var(--lens-ok) 45%, var(--lens-border)); }
.diff-badge.danger { color: var(--lens-danger-text); border-color: color-mix(in srgb, var(--lens-danger) 45%, var(--lens-border)); }
.diff-counts { display: inline-flex; gap: 5px; flex: 0 0 auto; font-size: 10px; font-variant-numeric: tabular-nums; }
.add { color: var(--lens-ok-text); }
.del { color: var(--lens-danger-text); }
.patch {
  border-top: 1px solid var(--lens-border);
  background: var(--lens-bg);
  max-height: 380px;
  overflow: auto;
  padding: 6px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--lens-border) transparent;
}
.patch-line {
  display: block;
  min-width: max-content;
  padding: 0 10px;
  font-family: var(--lens-mono);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre;
  color: var(--lens-text);
}
.patch-line.add { background: color-mix(in srgb, var(--lens-ok) 13%, transparent); color: var(--lens-ok-text); }
.patch-line.del { background: color-mix(in srgb, var(--lens-danger) 13%, transparent); color: var(--lens-danger-text); }
.patch-line.hunk { background: var(--lens-surface-2); color: var(--lens-muted); }
.patch-line.meta { color: var(--lens-muted); }
.truncated { padding: 5px 10px 8px; color: var(--lens-warn-text); font-size: 10px; }
.diff-note { padding: 6px 10px 2px; color: var(--lens-muted); font-size: 10px; }

.tree-row {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  min-height: 25px;
  padding: 2px 6px;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 55%, transparent);
  background: transparent;
  color: var(--lens-text);
  font: inherit;
  text-align: left;
  cursor: default;
}
.tree-row:last-child { border-bottom: 0; }
.tree-row.directory { cursor: pointer; }
.tree-row:hover { background: var(--lens-surface-2); }
.tree-chevron { flex: 0 0 auto; color: var(--lens-muted); transition: transform 150ms ease; }
.tree-chevron.open { transform: rotate(90deg); }
.tree-icon { flex: 0 0 auto; color: var(--lens-muted); }
.tree-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.tree-touched { width: 5px; height: 5px; border-radius: 50%; background: var(--lens-accent); margin-left: auto; flex: 0 0 auto; }
.tree-git { margin-left: auto; font-size: 9px; font-weight: 700; font-variant-numeric: tabular-nums; }
.tree-git.added { color: var(--lens-ok-text); }
.tree-git.deleted { color: var(--lens-danger-text); }
.tree-git.modified { color: var(--lens-warn-text); }
.tree-root { color: var(--lens-muted); font-size: 10px; font-family: var(--lens-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.inventory-filter {
  width: 100%;
  margin-bottom: 8px;
  padding: 5px 7px;
  border: 1px solid var(--lens-border);
  border-radius: 6px;
  background: var(--lens-surface);
  color: var(--lens-text);
  font: inherit;
  font-size: 11px;
}
.inventory-section { margin-bottom: 8px; }
.inventory-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.inventory-count { color: var(--lens-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.inventory-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--lens-border) 60%, transparent);
}
.inventory-item:last-child { border-bottom: 0; }
.inventory-body { min-width: 0; flex: 1; }
.inventory-name { font-size: 11px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inventory-desc { color: var(--lens-muted); font-size: 10px; margin-top: 1px; overflow-wrap: anywhere; }
.inventory-meta { color: var(--lens-muted); font-size: 9px; margin-top: 1px; overflow-wrap: anywhere; }

.history-card { padding: 9px 10px; }
.history-row { display: grid; grid-template-columns: 70px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 4px 0; }
.history-label { color: var(--lens-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.history-value { color: var(--lens-text); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.history-empty { color: var(--lens-muted); font-size: 10px; }
.sparkline { color: var(--lens-accent-text); overflow: visible; }
.sparkline.muted { color: var(--lens-muted); }
.sparkline.normal { color: var(--lens-accent-text); }
.history-card .lens-small { margin-top: 4px; }

.banner {
  padding: 9px 11px;
  margin-bottom: 12px;
  border: 1px solid color-mix(in srgb, var(--lens-warn) 45%, var(--lens-border));
  border-radius: var(--lens-radius);
  background: color-mix(in srgb, var(--lens-warn) 9%, var(--lens-surface));
}
.banner.error { border-color: color-mix(in srgb, var(--lens-danger) 45%, var(--lens-border)); background: color-mix(in srgb, var(--lens-danger) 8%, var(--lens-surface)); }
.banner-title { font-size: 11px; font-weight: 700; color: var(--lens-text); }
.banner-body { margin-top: 2px; color: var(--lens-muted); font-size: 10px; line-height: 1.4; }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 72px;
  padding: 18px 12px;
  border: 1px dashed var(--lens-border);
  border-radius: var(--lens-radius);
  background: var(--lens-surface);
  text-align: center;
}
.empty-title { color: var(--lens-text); font-size: 12px; font-weight: 600; }
.empty-body { color: var(--lens-muted); font-size: 10px; }
.muted { color: var(--lens-muted); }

@media (min-width: 480px) {
  .lens-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .context-card { grid-column: auto; }
  .duration-card { grid-column: auto; }
}
@media (max-width: 520px) {
  .token-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .turn-detail { grid-template-columns: 1fr; }
  .detail-full { grid-column: auto; }
}
@media (max-width: 560px) {
  .lens-tabs { gap: 4px; }
  .lens-tab { height: 26px; padding: 0 8px; gap: 5px; font-size: 11px; }
  .lens-tab-count { min-width: 14px; height: 14px; font-size: 8px; }
}
@media (max-width: 360px) {
  :root { --lens-pad: 12px; }
  .lens-title { font-size: 16px; }
  .lens-status { padding: 2px 6px; }
  .lens-tabs { gap: 4px; }
  .lens-tab { height: 26px; padding: 0 8px; gap: 5px; font-size: 11px; }
  .lens-tab-count { min-width: 14px; height: 14px; font-size: 8px; }
  .stat-value { font-size: 19px; }
  .token-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .agent-figures { width: 100%; }
}
@media (max-width: 300px) {
  .lens-grid { grid-template-columns: 1fr; }
  .context-card { grid-column: auto; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;
  var STATUS_STYLE = `${LENS_TOKENS}
html, body {
  margin: 0;
  height: 100%;
  background: var(--lens-bg);
  color: var(--lens-text);
  font-family: var(--oc-font, system-ui, sans-serif);
  font-size: 11px;
  line-height: 1.4;
}
#root {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  padding: 8px 10px;
  overflow: hidden;
}
.strip-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.strip-session {
  flex: 1;
  min-width: 0;
  color: var(--lens-muted);
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.strip-status { display: inline-flex; align-items: center; gap: 4px; color: var(--lens-muted); font-size: 9px; white-space: nowrap; }
.strip-pills { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
#root.open-panel { cursor: pointer; }
.strip-pill { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.strip-pill .label { color: var(--lens-muted); font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.strip-pill .value { color: var(--lens-text); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.strip-pill .value.normal { color: var(--lens-accent-text); }
.strip-pill .value.warning { color: var(--lens-warn-text); }
.strip-pill .value.danger { color: var(--lens-danger-text); }
.strip-pill .value.muted { color: var(--lens-text); }
.strip-empty { color: var(--lens-muted); font-size: 10px; }
.strip-error { color: var(--lens-danger-text); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 340px) {
  .strip-pills { gap: 3px 5px; }
  .strip-pill .label { font-size: 8px; letter-spacing: 0.04em; }
  .strip-pill .value { font-size: 11px; }
  .strip-model { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;

  // src/panel/main.ts
  var host = connectHost();
  var root = document.querySelector("#root");
  if (!root)
    throw new Error("Missing #root");
  var style = document.createElement("style");
  style.textContent = PANEL_STYLE;
  document.head.append(style);
  var mounted = false;
  var sessionId = null;
  var snapshot = null;
  var error = null;
  var tab = "overview";
  var inFlight = false;
  var diffSource = "session";
  var selectedTurn = 0;
  var diffRowsState = null;
  var diffMeta = "";
  var diffLoading = false;
  var diffError = null;
  var diffRequest = 0;
  var treeRoot = null;
  var treeEntries = {};
  var treeLoading = false;
  var treeError = null;
  var treeExpanded = new Set;
  var inventoryData = null;
  var inventoryLoading = false;
  var inventoryError = null;
  var inventoryFilter = "";
  var historyPoints = [];
  var historyError = null;
  var lastHistoryAt = 0;
  var settingsOpen = false;
  var brlRate = 0;
  var brlInput = "";
  var confirmingClear = false;
  var clearTimer = null;
  var confirmingStop = null;
  var confirmTimer = null;
  var stoppingAgents = new Set;
  var expandedTurns = new Set;
  var expandedDiffs = new Set;
  var visible = () => !document.hidden && root.getBoundingClientRect().width > 0;
  var turnOptions = () => (snapshot?.turns ?? []).map((turn) => ({
    index: turn.index,
    label: `#${turn.index} ${truncate(turn.request, 28)}`
  }));
  var diffView = () => ({
    source: diffSource,
    rows: diffSource === "session" ? null : diffRowsState ?? [],
    selectedTurn,
    turnOptions: turnOptions(),
    meta: diffMeta || (diffSource === "session" && snapshot ? `${snapshot.diff.length} arquivos` : ""),
    loading: diffLoading,
    error: diffError
  });
  var treeView = () => ({
    root: treeRoot,
    entries: treeEntries,
    expanded: treeExpanded,
    loading: treeLoading,
    error: treeError
  });
  var inventoryView = () => ({
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
    filter: inventoryFilter
  });
  var historyView = () => ({ points: historyPoints, error: historyError });
  var clearConfirm = () => {
    if (confirmTimer)
      clearTimeout(confirmTimer);
    confirmTimer = null;
    confirmingStop = null;
  };
  var askStop = (id) => {
    if (stoppingAgents.has(id))
      return;
    if (confirmingStop !== id) {
      clearConfirm();
      confirmingStop = id;
      render();
      confirmTimer = setTimeout(() => {
        confirmingStop = null;
        confirmTimer = null;
        render();
      }, 4000);
      return;
    }
    stopAgent(id);
  };
  var stopAgent = async (id) => {
    if (!sessionId)
      return;
    clearConfirm();
    stoppingAgents.add(id);
    render();
    try {
      const result = await requestInterrupt(host, id, sessionId);
      if (result.data) {
        await host.toast({
          kind: result.data.interrupted ? "info" : "success",
          message: result.data.interrupted ? "Pedido de parada enviado." : "O agente já não estava rodando."
        });
      } else {
        await host.toast({ kind: "error", message: result.error?.message ?? "Não foi possível parar o agente." });
      }
    } finally {
      stoppingAgents.delete(id);
      render();
      poll();
    }
  };
  var render = () => {
    if (!mounted)
      return;
    renderPanel(root, {
      snapshot,
      error,
      hasSession: sessionId !== null,
      tab,
      expandedTurns,
      expandedDiffs,
      diffView: diffView(),
      tree: treeView(),
      inventory: inventoryView(),
      history: historyView(),
      brlRate,
      settingsOpen,
      brlInput,
      confirmingClear,
      stoppingAgents,
      confirmingStop,
      onTab: (next) => {
        tab = next;
        render();
        if (next === "diffs" && diffSource !== "session")
          loadDiff();
        else if (next === "tree")
          loadTree();
        else if (next === "inventory")
          loadInventory();
        else if (next === "overview" && Date.now() - lastHistoryAt > 1e4)
          loadHistory();
        else
          poll();
      },
      onDiffSource: (next) => {
        diffRequest += 1;
        diffSource = next;
        diffRowsState = null;
        diffMeta = "";
        diffError = null;
        diffLoading = false;
        if (next === "turn" && selectedTurn === 0) {
          selectedTurn = snapshot?.turns.at(-1)?.index ?? 0;
        }
        render();
        if (next !== "session")
          loadDiff();
      },
      onSelectTurn: (index) => {
        selectedTurn = index;
        render();
        loadDiff();
      },
      onOpenAgent: (id) => {
        host.openSession(id).catch(() => {
          return;
        });
      },
      onStopAgent: askStop,
      onToggleTurn: (index) => {
        if (expandedTurns.has(index))
          expandedTurns.delete(index);
        else
          expandedTurns.add(index);
        render();
      },
      onToggleDiff: (path) => {
        if (expandedDiffs.has(path))
          expandedDiffs.delete(path);
        else
          expandedDiffs.add(path);
        render();
      },
      onTreeToggle: (path) => {
        if (treeExpanded.has(path)) {
          treeExpanded.delete(path);
          render();
        } else {
          treeExpanded.add(path);
          render();
          if (!treeEntries[path])
            loadTree(path);
        }
      },
      onInventoryFilter: (value) => {
        inventoryFilter = value;
        render();
        const input = root.querySelector(".inventory-filter");
        if (input) {
          input.focus();
          input.setSelectionRange(value.length, value.length);
        }
      },
      onSettings: () => {
        settingsOpen = !settingsOpen;
        render();
      },
      onBrlInput: (value) => {
        brlInput = value;
      },
      onSaveSettings: () => {
        saveSettings();
      },
      onClearHistory: askClearHistory
    });
  };
  var reset = () => {
    snapshot = null;
    error = null;
    expandedTurns.clear();
    expandedDiffs.clear();
    diffSource = "session";
    selectedTurn = 0;
    diffRowsState = null;
    diffMeta = "";
    diffLoading = false;
    diffError = null;
    diffRequest += 1;
    treeRoot = null;
    treeEntries = {};
    treeExpanded.clear();
    treeLoading = false;
    treeError = null;
    inventoryData = null;
    inventoryLoading = false;
    inventoryError = null;
    inventoryFilter = "";
    historyPoints = [];
    historyError = null;
    lastHistoryAt = 0;
    confirmingClear = false;
    if (clearTimer)
      clearTimeout(clearTimer);
    clearTimer = null;
    stoppingAgents.clear();
    clearConfirm();
    render();
  };
  var poll = async () => {
    if (!sessionId || inFlight || !visible())
      return;
    const wanted = sessionId;
    inFlight = true;
    try {
      const result = await requestSnapshot(host, wanted);
      if (sessionId !== wanted)
        return;
      if (result.data) {
        snapshot = result.data;
        error = null;
        if (selectedTurn === 0 && snapshot.turns.length > 0) {
          selectedTurn = snapshot.turns[snapshot.turns.length - 1].index;
        }
      } else {
        error = result.error ?? { code: "bad-answer", message: "Sem dados do serviço." };
      }
      render();
      if (tab === "overview" && Date.now() - lastHistoryAt > 1e4)
        loadHistory();
    } finally {
      inFlight = false;
    }
  };
  var loadDiff = async () => {
    if (!sessionId || diffSource === "session") {
      diffLoading = false;
      render();
      return;
    }
    const wanted = sessionId;
    const request = ++diffRequest;
    diffLoading = true;
    diffError = null;
    render();
    try {
      if (diffSource === "git") {
        const result = await requestGitDiff(host, wanted);
        if (request !== diffRequest || sessionId !== wanted)
          return;
        if (result.data) {
          diffRowsState = diffRowsFromFiles(result.data.files);
          const branch = result.data.branch ?? "—";
          const tracking = result.data.tracking ? ` → ${result.data.tracking}` : "";
          const travel = result.data.ahead || result.data.behind ? ` · ${result.data.ahead}↑ ${result.data.behind}↓` : "";
          diffMeta = `${branch}${tracking}${travel}`;
        } else {
          diffRowsState = [];
          diffError = result.error?.message ?? "Não foi possível ler o Git.";
        }
      } else {
        const turn = selectedTurn || snapshot?.turns.at(-1)?.index || 1;
        selectedTurn = turn;
        const result = await requestTurnDiff(host, wanted, turn);
        if (request !== diffRequest || sessionId !== wanted)
          return;
        if (result.data) {
          diffRowsState = diffRowsFromFiles(result.data);
          diffMeta = `#${turn} · ${result.data.length} arquivos`;
        } else {
          diffRowsState = [];
          diffError = result.error?.message ?? "Não foi possível ler o turno.";
        }
      }
    } finally {
      if (request === diffRequest) {
        diffLoading = false;
        render();
      }
    }
  };
  var setSession = (next) => {
    const id = next?.id ?? null;
    if (id === sessionId)
      return;
    sessionId = id;
    reset();
    if (id)
      poll();
  };
  var loadTree = async (key = ".", force = false) => {
    if (!sessionId)
      return;
    if (!force && treeEntries[key])
      return;
    const wanted = sessionId;
    treeLoading = true;
    treeError = null;
    render();
    try {
      const result = await requestTree(host, wanted, key === "." ? undefined : key);
      if (sessionId !== wanted)
        return;
      if (result.data) {
        treeRoot = result.data.root;
        treeEntries = { ...treeEntries, [key]: result.data.entries };
      } else {
        treeError = result.error?.message ?? "Não foi possível ler a árvore.";
      }
    } finally {
      treeLoading = false;
      render();
    }
  };
  var loadInventory = async (force = false) => {
    if (!sessionId || inventoryData && !force)
      return;
    const wanted = sessionId;
    inventoryLoading = true;
    inventoryError = null;
    render();
    try {
      const result = await requestInventory(host, wanted);
      if (sessionId !== wanted)
        return;
      if (result.data) {
        inventoryData = result.data;
      } else {
        inventoryError = result.error?.message ?? "Não foi possível ler o inventário.";
      }
    } finally {
      inventoryLoading = false;
      render();
    }
  };
  var loadHistory = async () => {
    if (!sessionId)
      return;
    const wanted = sessionId;
    lastHistoryAt = Date.now();
    try {
      const result = await requestHistory(host, wanted);
      if (sessionId !== wanted)
        return;
      if (result.data) {
        historyPoints = result.data;
        historyError = null;
      } else {
        historyError = result.error?.message ?? null;
      }
      render();
    } catch {}
  };
  var loadSettings = async () => {
    try {
      const stored = await host.storage.get("settings");
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const rate = stored.brlRate;
        if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
          brlRate = rate;
          brlInput = String(rate);
        }
      }
    } catch {}
    render();
  };
  var saveSettings = async () => {
    const rate = Number(brlInput.replace(",", "."));
    brlRate = Number.isFinite(rate) && rate > 0 ? Math.min(100, rate) : 0;
    brlInput = brlRate > 0 ? String(brlRate) : "";
    settingsOpen = false;
    render();
    try {
      await host.storage.set("settings", { brlRate });
      await host.toast({ kind: "success", message: "Cotação salva." });
    } catch {
      await host.toast({ kind: "error", message: "Não foi possível salvar a cotação." });
    }
  };
  var askClearHistory = () => {
    if (clearTimer)
      clearTimeout(clearTimer);
    if (!confirmingClear) {
      confirmingClear = true;
      render();
      clearTimer = setTimeout(() => {
        confirmingClear = false;
        clearTimer = null;
        render();
      }, 4000);
      return;
    }
    confirmingClear = false;
    clearTimer = null;
    render();
    if (!sessionId)
      return;
    clearHistory(host, sessionId).then((result) => {
      if (result.data) {
        historyPoints = [];
        historyError = null;
        render();
        host.toast({ kind: "success", message: "Histórico limpo." });
      } else {
        host.toast({ kind: "error", message: result.error?.message ?? "Não foi possível limpar." });
      }
    });
  };
  var mount = () => {
    if (mounted)
      return;
    mounted = true;
    render();
    loadSettings();
    loadHistory();
    setInterval(() => {
      if (visible())
        poll();
    }, 1500);
    document.addEventListener("visibilitychange", () => {
      if (visible())
        poll();
    });
    window.addEventListener("resize", () => {
      if (visible())
        poll();
    });
  };
  host.onReady((ctx) => {
    applyHostReady(ctx, document.documentElement);
    mount();
    setSession(ctx.session);
  });
  host.onSession((next) => {
    setSession(next);
  });
  host.onSessionLifecycle((event) => {
    if (event.sessionId === sessionId)
      poll();
  });
  host.onResolve(async ({ command }) => {
    if (command !== "lens")
      return null;
    await host.openSurface("plugin:lens");
    return null;
  });
  mount();
  poll();
})();
