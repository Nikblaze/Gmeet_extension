
chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
  sendResponse("Received by background script Notebook");
});
