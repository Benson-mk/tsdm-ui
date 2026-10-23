const translations: Record<string, readonly [string, string]> = {
  "This attachment has no verified insertion instruction. Continue in the native editor.":
    [
      "此附件没有已验证的插入指令。请在原生编辑器中继续。",
      "此附件沒有已驗證的插入指令。請在原生編輯器中繼續。",
    ],
  "New attachment authoring is not available for forum drafts yet.": [
    "论坛草稿暂不支持新附件编辑。",
    "論壇草稿暫不支援新附件編輯。",
  ],
  "This host cannot upload files.": [
    "此运行环境无法上传文件。",
    "此執行環境無法上傳檔案。",
  ],
  "Choose a nonempty file with an ordinary filename.": [
    "请选择内容非空且文件名正常的文件。",
    "請選擇內容非空且檔案名稱正常的檔案。",
  ],
  "The original account, permission or current form is unavailable. Nothing was uploaded.":
    [
      "原账号、权限或当前表单不可用。未上传任何文件。",
      "原帳號、權限或目前表單不可用。未上傳任何檔案。",
    ],
  "Current upload limits or authorization are unavailable. Nothing was uploaded.":
    [
      "无法取得当前上传限制或授权。未上传任何文件。",
      "無法取得目前上傳限制或授權。未上傳任何檔案。",
    ],
  "Upload cancelled before sending.": [
    "上传已在发送前取消。",
    "上傳已在傳送前取消。",
  ],
  "Upload may have reached the forum. Nothing will be retried automatically.": [
    "上传可能已到达论坛。不会自动重试任何操作。",
    "上傳可能已到達論壇。不會自動重試任何操作。",
  ],
  "Upload outcome is uncertain. Check the native attachment list before considering another upload.":
    [
      "上传结果未确定。再次上传前请检查原生附件列表。",
      "上傳結果未確定。再次上傳前請檢查原生附件清單。",
    ],
  "The forum refused this upload.": [
    "论坛拒绝了此次上传。",
    "論壇拒絕了此次上傳。",
  ],
  "Upload outcome is uncertain. No automatic retry.": [
    "上传结果未确定。不会自动重试。",
    "上傳結果未確定。不會自動重試。",
  ],
  "The forum returned an existing attachment ID. A new independent upload was not established.":
    [
      "论坛返回了现有附件编号。未能确认新的独立上传。",
      "論壇傳回了現有附件編號。未能確認新的獨立上傳。",
    ],
  "Upload accepted, but current attachment controls could not be verified. The upload is not confirmed associated.":
    [
      "上传已被接受，但无法验证当前附件控件。尚未确认上传关联。",
      "上傳已被接受，但無法驗證目前附件控制項。尚未確認上傳關聯。",
    ],
  "Account changed after upload. The original account may own this file; it was not adopted into current writing.":
    [
      "上传后账号已改变。此文件可能属于原账号，未纳入当前编辑。",
      "上傳後帳號已改變。此檔案可能屬於原帳號，未納入目前編輯。",
    ],
  "Upload interrupted. It may already be stored; no upload was repeated.": [
    "上传已中断。文件可能已存储；未重复上传。",
    "上傳已中斷。檔案可能已儲存；未重複上傳。",
  ],
  "Server file removal for forum drafts is not available yet.": [
    "论坛草稿暂不支持移除服务器文件。",
    "論壇草稿暫不支援移除伺服器檔案。",
  ],
  "This removal is unavailable or already attempted. Check its original result.":
    [
      "此移除操作不可用或已尝试。请检查原操作结果。",
      "此移除操作不可用或已嘗試。請檢查原操作結果。",
    ],
  "Original account or current removal permission is unavailable.": [
    "原账号或当前移除权限不可用。",
    "原帳號或目前移除權限不可用。",
  ],
  "The current attachment could not be established. Nothing was removed.": [
    "无法确认当前附件。未移除任何文件。",
    "無法確認目前附件。未移除任何檔案。",
  ],
  "The account changed before removal. Nothing was removed.": [
    "移除前账号已改变。未移除任何文件。",
    "移除前帳號已改變。未移除任何檔案。",
  ],
  "Current removal form is unavailable.": [
    "当前移除表单不可用。",
    "目前移除表單不可用。",
  ],
  "Current removal token is unavailable.": [
    "当前移除凭证不可用。",
    "目前移除憑證不可用。",
  ],
  "Removal is uncertain. No removal was repeated.": [
    "移除结果未确定。未重复移除。",
    "移除結果未確定。未重複移除。",
  ],
  "Removal is uncertain: current attachment absence could not be verified.": [
    "移除结果未确定：无法验证当前附件已不存在。",
    "移除結果未確定：無法驗證目前附件已不存在。",
  ],
  "Server file removal verified. Source references are separate; remove any remaining tag before saving.":
    [
      "已验证服务器文件移除。正文引用是独立内容；保存前请移除任何剩余标签。",
      "已驗證伺服器檔案移除。正文引用是獨立內容；儲存前請移除任何剩餘標籤。",
    ],
  "Removal check was interrupted. No removal was repeated.": [
    "移除结果检查已中断。未重复移除。",
    "移除結果檢查已中斷。未重複移除。",
  ],
  "Refresh recovery must be available before upload.": [
    "上传前必须能够保存刷新恢复信息。",
    "上傳前必須能夠儲存重新整理恢復資訊。",
  ],
  "Removal may have happened. Check result; nothing was replayed.": [
    "移除可能已发生。请检查结果；未重放任何操作。",
    "移除可能已發生。請檢查結果；未重播任何操作。",
  ],
  "Upload may already be stored. No upload was replayed.": [
    "上传可能已存储在论坛。未重放任何上传。",
    "上傳可能已儲存在論壇。未重播任何上傳。",
  ],
  "Checking independently received file bytes…": [
    "正在核对独立接收的文件内容…",
    "正在核對獨立接收的檔案內容…",
  ],
  "Immediate server-file removal pending. Local discard cannot undo it.": [
    "正在立即移除服务器文件。丢弃本地编辑无法撤销。",
    "正在立即移除伺服器檔案。捨棄本機編輯無法復原。",
  ],
  "Recovery unavailable; removal was not sent.": [
    "恢复信息不可用；未发送移除请求。",
    "恢復資訊不可用；未傳送移除請求。",
  ],

  "New uploads and server-file removal for drafts are not available yet. Existing references remain preserved when saving.":
    [
      "草稿暂不支持新上传或服务器文件移除。保存时会保留现有引用。",
      "草稿暫不支援新上傳或伺服器檔案移除。儲存時會保留現有引用。",
    ],
  "Select attachments": ["选择附件", "選擇附件"],
  "Attachment authoring": ["附件编辑", "附件編輯"],
  Selected: ["已选择", "已選擇"],
  Uploading: ["上传中", "上傳中"],
  "Uploaded, unassociated": ["已上传，尚未关联", "已上傳，尚未關聯"],
  "Inline referenced": ["已插入正文引用", "已插入正文引用"],
  "Saved association verified": ["已验证保存关联", "已驗證儲存關聯"],
  "Upload outcome uncertain": ["上传结果未确定", "上傳結果未確定"],
  "Upload refused": ["上传被拒绝", "上傳被拒絕"],
  "Reselect file bytes": ["请重新选择文件", "請重新選擇檔案"],
  "Server file removed": ["服务器文件已移除", "伺服器檔案已移除"],
  "Removing server file": ["正在移除服务器文件", "正在移除伺服器檔案"],
  "Server removal uncertain": ["服务器移除结果未确定", "伺服器移除結果未確定"],
  Upload: ["上传", "上傳"],
  Insert: ["插入", "插入"],
  "Remove local selection": ["移除本地选择", "移除本機選擇"],
  "Remove server file": ["移除服务器文件", "移除伺服器檔案"],
  "Check stored bytes": ["核对已存储文件", "核對已儲存檔案"],
  "Attachment upload progress": ["附件上传进度", "附件上傳進度"],
  "Check file removal result": ["检查文件移除结果", "檢查檔案移除結果"],
  "Confirm immediate file removal": ["确认立即移除文件", "確認立即移除檔案"],
  "Keep server file": ["保留服务器文件", "保留伺服器檔案"],
  "This removes the server file immediately and cannot be undone by discarding local writing. Body references are separate.":
    [
      "这将立即移除服务器文件，丢弃本地编辑无法撤销。正文引用是独立内容。",
      "這將立即移除伺服器檔案，捨棄本機編輯無法復原。正文引用是獨立內容。",
    ],
  "Original selected bytes sent. Upload success does not establish a saved association.":
    [
      "已发送选择的原始文件。上传成功不代表已关联到保存内容。",
      "已傳送選擇的原始檔案。上傳成功不代表已關聯到儲存內容。",
    ],
  "Existing saved attachment. Removing its source tag does not remove the server file.":
    [
      "现有已保存附件。移除正文标签不会移除服务器文件。",
      "現有已儲存附件。移除正文標籤不會移除伺服器檔案。",
    ],
  "Uploading selected bytes…": ["正在上传选择的文件…", "正在上傳選擇的檔案…"],
  "File bytes are not retained across refresh. Select the file again.": [
    "刷新后不保留文件内容。请重新选择文件。",
    "重新整理後不保留檔案內容。請重新選擇檔案。",
  ],
  "Stored filename and bytes match the selected file.": [
    "已存储的文件名和内容与选择的文件一致。",
    "已儲存的檔案名稱和內容與選擇的檔案一致。",
  ],
  "Server file differs from selected bytes or filename. Server normalization is disclosed; original byte identity is not claimed.":
    [
      "服务器文件的内容或名称与所选文件不同，可能已被服务器调整，不能声称内容完全一致。",
      "伺服器檔案的內容或名稱與所選檔案不同，可能已被伺服器調整，不能聲稱內容完全一致。",
    ],
  "The current form does not permit this file type.": [
    "当前表单不允许这种文件类型。",
    "目前表單不允許這種檔案類型。",
  ],
  "The file exceeds the current size limit.": [
    "文件超过当前大小限制。",
    "檔案超過目前大小限制。",
  ],
  "The current attachment count or daily quota is exhausted.": [
    "当前附件数量或每日额度已用完。",
    "目前附件數量或每日額度已用完。",
  ],
};
export function attachmentText(value: string, language: string): string {
  const translated = translations[value];
  return translated
    ? language === "zh-CN"
      ? translated[0]
      : language === "zh-TW"
        ? translated[1]
        : value
    : value;
}
