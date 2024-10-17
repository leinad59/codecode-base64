console.log("背景脚本已加载");

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log("扩展已安装/更新");
  
  function createMenuItem(createProperties) {
    chrome.contextMenus.create(createProperties, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error creating menu item: ${chrome.runtime.lastError.message}`);
      }
    });
  }

  createMenuItem({
    id: "base64Menu",
    title: "Base64 编码解码",
    contexts: ["selection"]
  });
  createMenuItem({
    id: "originalText",
    title: "原文",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
  createMenuItem({
    id: "separator1",
    type: "separator",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
  createMenuItem({
    id: "base64Encode",
    title: "编码",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
  createMenuItem({
    id: "base64Decode",
    title: "解码",
    parentId: "base64Menu",
    contexts: ["selection"]
  });
});

// 动态注入内容脚本
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content/content.js']
    });
    console.log("内容脚本已注入到标签页", tabId);
  } catch (err) {
    console.error("注入内容脚本时出错:", err);
  }
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    injectContentScript(tabId);
  }
});

// 获取最新选中文本
async function getLatestSelectedText(tabId) {
  try {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "getSelectedText" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("获取最新选中文本时出错:", chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response && response.text);
        }
      });
    });
  } catch (err) {
    console.error("获取最新选中文本时出错:", err);
    return null;
  }
}

// 安全的 Base64 解码函数
function safeAtob(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error("Base64 解码错误:", e);
    return "无法解码: 不是有效的 Base64 字符串或包含非 Latin1 字符";
  }
}

// 安全的 Base64 编码函数
function safeBtoa(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("Base64 编码错误:", e);
    return "无法编码";
  }
}

// 更新右键菜单
async function updateContextMenu(info, tab) {
  console.log("更新右键菜单", info);
  let selectedText = info.selectionText;

  // 获取最新选中文本
  const latestText = await getLatestSelectedText(tab.id);
  if (latestText) {
    selectedText = latestText;
  }

  let encodedText = safeBtoa(selectedText);
  let decodedText = safeAtob(selectedText);

  // 更新菜单项
  chrome.contextMenus.update("originalText", {
    title: `原文: ${selectedText.substr(0, 20)}${selectedText.length > 20 ? '...' : ''}`
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("更新原文菜单项错误:", chrome.runtime.lastError);
    }
  });
  chrome.contextMenus.update("base64Encode", {
    title: `编码: ${encodedText.substr(0, 20)}${encodedText.length > 20 ? '...' : ''}`
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("更新编码菜单项错误:", chrome.runtime.lastError);
    }
  });
  chrome.contextMenus.update("base64Decode", {
    title: `解码: ${decodedText.substr(0, 20)}${decodedText.length > 20 ? '...' : ''}`
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
    updateContextMenu({ selectionText: request.text }, sender.tab);
  }
  // 确保返回 true 以保持消息通道开放
  return true;
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("菜单项被点击", info);

  // 获取最新选中文本
  const selectedText = await getLatestSelectedText(tab.id) || info.selectionText;

  if (!selectedText) {
    console.log("没有选中文本");
    return;
  }

  let textToCopy = "";
  if (info.menuItemId === "originalText") {
    textToCopy = selectedText;
  } else if (info.menuItemId === "base64Encode") {
    textToCopy = safeBtoa(selectedText);
  } else if (info.menuItemId === "base64Decode") {
    textToCopy = safeAtob(selectedText);
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
