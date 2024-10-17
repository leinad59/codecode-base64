console.log("背景脚本已加载");

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装/更新");
  chrome.contextMenus.create({
    id: "base64Menu",
    title: "Base64 编码解码",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "base64Encode",
    title: "编码: %s",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "base64Decode",
    title: "解码: %s",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
});

// 更新右键菜单
function updateContextMenu(info) {
  console.log("更新右键菜单", info);
  const selectedText = info.selectionText;
  let encodedText, decodedText;

  // 编码
  try {
    encodedText = btoa(unescape(encodeURIComponent(selectedText)));
  } catch (e) {
    encodedText = "无法编码";
    console.error("编码错误:", e);
  }

  // 解码
  try {
    decodedText = decodeURIComponent(escape(atob(selectedText)));
  } catch (e) {
    decodedText = "无法解码: 不是有效的 Base64 字符串";
    console.error("解码错误:", e);
  }

  // 更新菜单项
  chrome.contextMenus.update("base64Encode", {
    title: `编码: ${encodedText}`
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("更新编码菜单项错误:", chrome.runtime.lastError);
    }
  });
  chrome.contextMenus.update("base64Decode", {
    title: `解码: ${decodedText}`
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("更新解码菜单项错误:", chrome.runtime.lastError);
    }
  });

  // 保存结果到本地存储
  chrome.storage.local.set({
    lastResult: {
      selectedText: selectedText,
      encodedText: encodedText,
      decodedText: decodedText
    }
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("保存到本地存储错误:", chrome.runtime.lastError);
    } else {
      console.log("结果已保存到本地存储");
    }
  });
}

// 监听选中文本变化
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("收到消息:", request);
  if (request.action === "textSelected") {
    updateContextMenu({ selectionText: request.text });
  }
  // 确保返回 true 以保持消息通道开放
  return true;
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("菜单项被点击", info);
  if (!info.selectionText) {
    console.log("没有选中文本");
    return;
  }

  let textToCopy = "";
  if (info.menuItemId === "base64Encode") {
    try {
      textToCopy = btoa(unescape(encodeURIComponent(info.selectionText)));
    } catch (e) {
      console.error("编码错误:", e);
      textToCopy = "无法编码";
    }
  } else if (info.menuItemId === "base64Decode") {
    try {
      textToCopy = decodeURIComponent(escape(atob(info.selectionText)));
    } catch (e) {
      console.error("解码错误:", e);
      textToCopy = "无法解码: 不是有效的 Base64 字符串";
    }
  }

  console.log("准备复制的文本:", textToCopy);

  if (textToCopy) {
    chrome.tabs.sendMessage(tab.id, {action: "copyToClipboard", text: textToCopy}, (response) => {
      if (chrome.runtime.lastError) {
        console.error("发送消息时出错:", chrome.runtime.lastError);
      } else {
        console.log("消息已发送到内容脚本, 响应:", response);
      }
    });
  }
});
