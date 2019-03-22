
chrome.runtime.onInstalled.addListener(function(details) {
  switch (details.reason) {
    case "install":
      chrome.tabs.create({url: "https://www.youtube.com/watch?v=88em2rWPx_o"});
      break;
    default:
      return true;
  }
});
