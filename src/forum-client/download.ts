import type { AttachmentResult, FileResponse } from "./types.js";
export function fileFailure(
  response: FileResponse,
): Exclude<AttachmentResult, { kind: "file" }> | null {
  const encoding =
    response.bytes[0] === 0xff && response.bytes[1] === 0xfe
      ? "utf-16le"
      : response.bytes[0] === 0xfe && response.bytes[1] === 0xff
        ? "utf-16be"
        : "utf-8";
  const sample = new TextDecoder(encoding).decode(
    response.bytes.subarray(0, 16384),
  );
  // A markup-leading payload remains a response document even when its MIME
  // lies or a long comment hides the recognizable forum error farther down.
  const html =
    /(?:text\/html|application\/xhtml\+xml)/i.test(response.contentType) ||
    /^\s*</.test(sample);
  if (
    response.status === 401 ||
    (html && /loginform|name=["']?password|请先登录|尚未登录/i.test(sample))
  )
    return {
      kind: "login",
      message:
        "The forum returned a login page instead of a file. Sign in through the native forum, then try again.",
    };
  if (
    html &&
    /captcha|security verification|验证码|安全验证|challenge/i.test(sample)
  )
    return {
      kind: "challenge",
      message:
        "The forum returned a verification challenge instead of a file. Complete it in the native forum.",
    };
  if (html && /需要付费|付费后下载|购买|payment required/i.test(sample))
    return {
      kind: "permission",
      message:
        "The forum requires payment before download. No purchase was attempted and no file is ready to save.",
    };
  if (
    response.status === 403 ||
    (html && /没有权限|无权|权限不足|permission|拒绝访问/i.test(sample))
  )
    return {
      kind: "permission",
      message:
        "The forum refused download permission. No file is ready to save.",
    };
  if (
    response.status === 404 ||
    response.status === 410 ||
    (html && /附件不存在|文件不存在|file not found/i.test(sample))
  )
    return {
      kind: "missing",
      message: "The attachment file is missing. No file is ready to save.",
    };
  if (html)
    return {
      kind: "invalid",
      message:
        "The forum returned an HTML page instead of a confirmed file. Nothing is ready to save.",
    };
  if (
    /(?:application\/(?:json|[^;]+\+json)|text\/xml)/i.test(
      response.contentType,
    )
  )
    return {
      kind: "invalid",
      message:
        "The forum returned a response document instead of a confirmed file. Nothing is ready to save.",
    };
  if (response.status !== 200 || response.redirected)
    return {
      kind: "invalid",
      message:
        "The forum did not return a complete file. Nothing is ready to save.",
    };
  if (
    !response.bytes.length ||
    (response.contentLength !== null &&
      !response.contentEncoding &&
      (!/^\d+$/.test(response.contentLength) ||
        Number(response.contentLength) !== response.bytes.length))
  )
    return {
      kind: "invalid",
      message:
        "The file response was empty or incomplete. Nothing is ready to save.",
    };
  return null;
}
