
chrome.runtime.onInstalled.addListener(function(details) {
  switch (details.reason) {
    case "install":
      chrome.tabs.create({url: "https://www.youtube.com/watch?v=UQ2UOsGUQpM&t=256s"});
      break;
    default:
      return true;
  }
});
