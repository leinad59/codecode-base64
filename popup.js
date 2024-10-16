// 获取当前活动标签页
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  // 向content script发送消息,请求获取选中的文本
  chrome.tabs.sendMessage(tabs[0].id, { action: "getSelection" }, (response) => {
    if (response && response.selectedText) {
      const selectedText = response.selectedText;
      
      // 显示选中的文本
      document.getElementById("selectedText").value = selectedText;
      
      // Base64 编码
      const encodedText = btoa(selectedText);
      document.getElementById("encodedText").value = encodedText;
      
      // Base64 解码
      try {
        const decodedText = atob(selectedText);
        document.getElementById("decodedText").value = decodedText;
      } catch (e) {
        // 如果解码失败,显示错误信息
        document.getElementById("decodedText").value = "无法解码: 不是有效的 Base64 字符串";
      }
    }
  });
});

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("弹出窗口收到消息:", request);
  if (request.action === "updatePopup") {
    document.getElementById("selectedText").value = request.selectedText;
    document.getElementById("encodedText").value = request.encodedText;
    document.getElementById("decodedText").value = request.decodedText;
    
    // 保存最新结果到本地存储
    chrome.storage.local.set({lastResult: request});
  }
});

// 初始化时尝试获取上次的结果
chrome.storage.local.get(["lastResult"], (result) => {
  if (result.lastResult) {
    document.getElementById("selectedText").value = result.lastResult.selectedText;
    document.getElementById("encodedText").value = result.lastResult.encodedText;
    document.getElementById("decodedText").value = result.lastResult.decodedText;
  }
});

// 复制功能
function copyText(elementId) {
  const text = document.getElementById(elementId).value;
  navigator.clipboard.writeText(text).then(() => {
    console.log("文本已复制到剪贴板");
    // 视觉反馈
    const button = document.querySelector(`button[data-target="${elementId}"]`);
    const originalText = button.textContent;
    button.textContent = "已复制！";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  }).catch(err => {
    console.error("复制失败:", err);
  });
}

// 添加复制按钮事件监听器
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM 已加载，添加事件监听器");
  document.getElementById("copySelected").addEventListener("click", () => copyText("selectedText"));
  document.getElementById("copyEncoded").addEventListener("click", () => copyText("encodedText"));
  document.getElementById("copyDecoded").addEventListener("click", () => copyText("decodedText"));
});
