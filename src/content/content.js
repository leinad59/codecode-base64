console.log("内容脚本已加载");

// Only initialize if not already defined
if (typeof window.debouncedSendSelectedText === 'undefined') {
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 发送选中文本到背景脚本
  function sendSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "textSelected",
        text: selectedText
      });
    }
  }

  // 使用防抖包装 sendSelectedText 函数，并将其附加到 window 对象
  window.debouncedSendSelectedText = debounce(sendSelectedText, 300);

  // 监听文本选择事件
  document.addEventListener('selectionchange', window.debouncedSendSelectedText);
}

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("内容脚本收到消息:", request);
  if (request.action === "copyToClipboard") {
    const textArea = document.createElement("textarea");
    textArea.value = request.text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      console.log("复制操作结果:", success ? "成功" : "失败");
      sendResponse({success: success});
    } catch (err) {
      console.error('无法复制文本: ', err);
      sendResponse({success: false, error: err.message});
    }
    
    document.body.removeChild(textArea);
  } else if (request.action === "getSelectedText") {
    // 新增：响应获取选中文本的请求
    sendResponse({text: window.getSelection().toString().trim()});
  }
  return true; // 保持消息通道开放
});
