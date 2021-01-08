
chrome.storage.sync.get(['timeText','status','ctext'], function (obj) {
  $("#timeText").text(obj.timeText); //setting value of timeText as object from
  $("#time")[0].value=obj.timeText;
  $("#ctext").text(obj.ctext);
  $("#criteria")[0].value = obj.ctext;
  if(obj.status===1){
  $(".status")[0].innerText="Running";
  }
  else{
    $(".status")[0].innerText="Inactive";
  }
    });
$(document).on('input', '#time', function () {
    $("#timeText")[0].innerText = $("#time")[0].value;
});
$(document).on('input', '#criteria', function () {
    $("#ctext")[0].innerText= $("#criteria")[0].value;
});
$(document).on('click', '#start, #stop, #save, #clear', (e) => {
    delay = $("#time")[0].value;
    c_val= $("#criteria")[0].value;
    chrome.storage.sync.set({timeText:delay});// setting value in chrome storage
    chrome.storage.sync.set({ctext:c_val});
    if(e.target.id==="start"){
      chrome.storage.sync.set({status:1});
    }
    else{
      chrome.storage.sync.set({status:0});
    }
    console.log(" == " + $("#status"));
    //sending message to content script
    chrome.runtime.sendMessage({ dist: "content", action: e.target.id, delay: delay, criteria: c_val }, (res) => {
        console.log(res);
        if (!res) {
            $(".status")[0].innerText = "Error Connecting";
        }
    });
})

// Event Listener for Status
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.dist === "popup") {
        $(".status")[0].innerText = request.data;
        sendResponse("Received by Popup Script");
    }
})
