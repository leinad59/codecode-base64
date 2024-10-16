console.log("内容脚本已加载");

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
  }
  return true; // 保持消息通道开放
});

// 监听文本选择事件
document.addEventListener('selectionchange', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: "textSelected",
      text: selectedText
    });
  }
});
