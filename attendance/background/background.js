
// For Declearative Content
var c=0;
chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'developer.chrome.com' },
        })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
});
// Event Listener for data recieved from content script

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Data Received", request);
    if (request.dist === "background") {
        if(request.status == 0){
          createDocument(request.dataValues, request.participantNames, request.timeValues, request.meetingId,request.meetingname);
        }
        else
          createfinalDocument(request.meetingId,request.meetingname);
        sendResponse("Received by background script");
    }
    else if(request.dist==="opentab"){
        console.log("open tab created");
      chrome.tabs.create({url: chrome.extension.getURL("classlist.html")});
      console.log(request.meetingId,request.meetingname);
      sendResponse("Received by background script");
    }
      else if(request.dist==="classlist"){
        console.log(request.text);
        createfinalDocument(request.text.substring(0,12),request.text.substring(13));
        sendResponse("Received by background script");
      }
    else if (request.dist === "content") {
        // To send back your response  to the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
                console.log(response);
            });
        })
        sendResponse("Received by background script");
    }
});

const getTemplate = new Promise((resolve, reject) => {
    var client = new XMLHttpRequest();
    client.open('GET', '/attendance/background/template.html');
    client.onreadystatechange = _ => {
        if (client.readyState === 4) {
            resolve(client.responseText);
        }
    }
    client.send();
})
// function for HTML Creation
async function createDocument(dataValues, key, timeValues, meetingId,meetingname) {
    var template = "";
    let now = new Date();
    let currentTime = now.getHours() + ':' + (now.getMinutes().toString());
    let currentDate = now.getFullYear() + '-' + (now.getMonth() + 1).toString() + '-' + now.getDate().toString();

    var thead = "";
    var tbody = "";

    // Time Value Header Create
    for (let el of timeValues) {
        thead += '<th>' + el + '</th>\n';
    }

    // Data Value Create
    key.sort();
    for (let el of key) {
        let sn = '<td>' + (key.indexOf(el) + 1) + '</td>';
        let name = '<td>' + el + '</td>';
        let t = dataValues[el];
        let tdata = "";
        for (let i of timeValues) {
            if (t.includes(i)) {
                tdata += '<td class="present">' + "<p>P</p>" + '</td>';
            }
            else {
                tdata += '<td class="absent">' + "A" + '</td>';
            }
        }
        tbody += '<tr>' + sn + name + tdata + '</tr>';
    }

    template = await getTemplate;

    template = template.replace('[%%title%%]', (currentDate + " " + currentTime));
    template = template.replace('[%%date%%]', currentDate);
    template = template.replace('[%%time%%]', currentTime);
    template = template.replace('[%%meetID%%]', meetingId.substring(0,12));
    template = template.replace('[%%meetingname%%]', meetingname);
    template = template.replace('[%%tableHead%%]', thead);
    template = template.replace('[%%tableBody%%]', tbody);

    filename = "attendance_" + currentDate + ".html";
    var blob = new Blob([template], { type: 'text/html;charset=utf-8' });
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: filename
    });
}


//function to create final attendance List
async function createfinalDocument(meetingId,meetingname) {
  chrome.storage.sync.get(['classarray'], async function(result) {
    var template = "";
    let now = new Date();
    let currentTime = now.getHours() + ':' + (now.getMinutes().toString());
    let currentDate = now.getFullYear() + '-' + (now.getMonth() + 1).toString() + '-' + now.getDate().toString();
    var thead = "";
    var tbody = "";
    // Time Value Header Create
    let dataofthismeeting;
    for(index of result.classarray){
      if(index.meetingId.substring(0,12)===meetingId.substring(0,12)){
        dataofthismeeting=index;
        break;
      }
    }
    for(index of dataofthismeeting.logging){
      thead += '<th>' + index.currentDate + '</th>\n';
    }
    var temp = dataofthismeeting.totalparticipantsofclass;

    // Data Value Create
    temp.sort();
    for (let el of temp) {
      let sn = '<td>' + (temp.indexOf(el) + 1) + '</td>';
      let name = '<td>' + el + '</td>';
      let tdata = "";
      for(index of dataofthismeeting.logging){
        let t = index.attend[el];
        if (t==="P") {
          tdata += '<td class="present">' + "<p>P</p>" + '</td>';
        }
        else {
          tdata += '<td class="absent">' + "A" + '</td>';
        }
      }
      tbody += '<tr>' + sn + name + tdata + '</tr>';
    }
    template = await getTemplate;

    template = template.replace('[%%title%%]', (currentDate + " " + currentTime));
    template = template.replace('[%%date%%]', currentDate);
    template = template.replace('[%%time%%]', currentTime);
    template = template.replace('[%%meetID%%]', meetingId.substring(0,12));
    template = template.replace('[%%meetingname%%]', meetingname);
    template = template.replace('[%%tableHead%%]', thead);
    template = template.replace('[%%tableBody%%]', tbody);

    filename = "attendance_" + currentDate + ".html";
    var blob = new Blob([template], { type: 'text/html;charset=utf-8' });
    let url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: filename
    });
  });
}
