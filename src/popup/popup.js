console.log("弹出脚本已加载");

function updateLiveResults() {
  const originalText = document.getElementById("originalText").value;
  let encodedText, decodedText;

  // 编码
  try {
    encodedText = btoa(unescape(encodeURIComponent(originalText)));
  } catch (e) {
    encodedText = "无法编码";
    console.error("编码错误:", e);
  }

  // 解码
  try {
    decodedText = decodeURIComponent(escape(atob(originalText)));
  } catch (e) {
    decodedText = "无法解码: 不是有效的 Base64 字符串";
    console.error("解码错误:", e);
  }

  document.getElementById("liveEncodedText").value = encodedText;
  document.getElementById("liveDecodedText").value = decodedText;
}

// 初始化时获取最新结果
function loadLatestResult() {
  chrome.storage.local.get(["lastResult"], (result) => {
    console.log("从本地存储获取结果:", result);
    if (result.lastResult) {
      document.getElementById("selectedText").textContent = result.lastResult.selectedText || "";
      document.getElementById("encodedText").textContent = result.lastResult.encodedText || "";
      document.getElementById("decodedText").textContent = result.lastResult.decodedText || "";
    }
  });
}

// 复制功能
function copyText(elementId) {
  const text = document.getElementById(elementId).textContent || document.getElementById(elementId).value;
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

// 在 DOMContentLoaded 事件中设置事件监听器和加载最新结果
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM 已加载，添加事件监听器");
  
  // 加载最新结果
  loadLatestResult();
  
  // 为原文文本框添加输入事件监听器
  document.getElementById("originalText").addEventListener("input", updateLiveResults);
  
  // 添加复制按钮事件监听器
  const copyButtons = document.querySelectorAll('button[id^="copy"]');
  copyButtons.forEach(button => {
    button.addEventListener("click", () => copyText(button.dataset.target));
  });
});
