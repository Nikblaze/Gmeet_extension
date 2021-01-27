// Global Variables
var dataStorage = {};       // Data Variable
var participantNames = [];   // For Key Storage
var timeStamp = [];         // For Time Storage
var interval_id;            // For start and stop Monitoring
var meetingId;             // For storing Meeting ID
var attend={};
var status;
let duration=1;
let meetingname;
// Function to Fetch List of Participants
function getListOfParticipants() {
    let data = [];
    for (let i of $("[data-participant-id], [data-requested-participant-id]")) {
      let name = i.outerText || i.innerText;
      // Skip if Name is You
      if (name == "You") {
          continue;
      }
         if(name.includes("presenting")||name.includes("Presenting")||name.includes("Presention")||name.includes("presention")||name.includes("joined")||name.includes("Joined")){
        continue;
      
      }
      if(name[0] !== '5')continue;
      // Remove Unnecessary things from name
      name = name.replace('\n', '');
      name = name.replace('Hide Participant', '');
      name = name.trim();
      data.push(name);
  }
    return data;
}

// Function to Log Participants data with TimeStamp
function logParticipantsData() {
    let now = new Date();
    let currentTime = now.getHours() + ':' + now.getMinutes().toString();
    let data = getListOfParticipants(); // Returns current Name List of Participants
    console.log(data);
    // Loops through Participants list
    for (let name of data) {
        let time = dataStorage[name] || [];
        time.push(currentTime); // this is same as dataStorage[name].push(currentTime)
        dataStorage[name] = time;
        if (!participantNames.includes(name)) {
            participantNames.push(name);
        }
    }
    timeStamp.push(currentTime);
    console.log(dataStorage);
}
// Function to get Meeting ID
function getMeetingId() {
    let id = window.location.href;
    id = id.split('/')[3];
    if (id[3] !== '-' || id[8] !== '-') {
        console.log("Not a Meeting");
        return false;
    }
    if (meetingId !== id) {
        clearData();
        console.log("New Meeting");
    }
    //meetingId = id;
    meetingId=id;//.substring(0,12);
    return true;
}

// Function to Start Monitoring
function startMonitoring(time = 300000) {
    dataStorage = {};
    participantNames = [];
    timeStamp = [];
    attend={};
    duration=1;
    stopMonitoring();
    // getMeetingId returns false if not a meeting
    if (!getMeetingId()) {

        return false;
    }
    logParticipantsData(); // Logs data on Start
    interval_id = setInterval(function () {
        logParticipantsData();
        duration=duration+1; // Logs data on Specific Intervel
    }, time);
    console.log('started');
}

// Function to Stop Monitoring
function stopMonitoring() {
    if (!(interval_id == undefined)) {
        clearInterval(interval_id);
        interval_id = undefined;

    }
    console.log('stopped');
}



// Function to clear dataStorage
function clearData() {
    dataStorage = {};
    participantNames = [];
    timeStamp = [];
    attend={};
    duration=1;
    console.log('cleared');
}


// Event Listiner from popup.js
chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.dist === "content") {
        console.log(request);
       if (request.action === "classlist") {
          opentab();
          sendResponse("class list opening");
        }
        else if (getMeetingId()) {
            let action = request.action;
            if (action === "start") {
              meetingname=$('.SQHmX .Jyj1Td.CkXZgc').text();
              console.log("name of the class -------");
              console.log(meetingname);
                let delay = request.delay;
                delay = parseInt(delay);
                if (isNaN(delay)) {
                    delay = 5;
                }
                let t_mil = delay * 60000;
                startMonitoring(t_mil);
                sendResponse("Started");
            }
            else if (action === "stop") {
                stopMonitoring();
                sendResponse("Stopped");
                let array=Object.keys(dataStorage);
                console.log('array :');
                console.log(array);
                for(let name of array){
                  let w=dataStorage[name].length;
                  console.log('name : '+name+' w: '+w+' duration: '+duration);
                  let percent=(w*100)/duration;
                  let min_val=request.criteria;
                  console.log('criteria : '+min_val);
                  if(percent>=min_val) attend[name]='P';
                  else attend[name]='A';
                }
                console.log('attend :');
                console.log(attend);
                chrome.storage.sync.get(['classarray'], function(result) {
                  console.log(result.classarray);
                  let obj1=[];
                  if(result.classarray!==undefined){
                    obj1=result.classarray;
                  }
                  let flag=false;
                  let indexofmeeting=-1;
                  let i;
                  for(i=0;i<obj1.length;i++){
                    if(obj1[i].meetingId.substring(0,12)==meetingId.substring(0,12)){
                      indexofmeeting=i;
                      flag=true;
                      break;
                    }
                  }
                  if(flag){
                    var totalparticipantsofclass = obj1[indexofmeeting].totalparticipantsofclass;
                    var logging = obj1[indexofmeeting].logging;
                  }else{
                    var totalparticipantsofclass = [];
                    var logging = [];
                  }
                  console.log(logging);
                    //totalparticipantsofclass is updated
                    for(let el of participantNames){
                      if (!totalparticipantsofclass.includes(el)) {
                        totalparticipantsofclass.push(el);
                        console.log("el -  " + el);
                      }
                    }
                    let now = new Date();
                    let currentDate = now.getFullYear() + '-' + (now.getMonth() + 1).toString() + '-' + now.getDate().toString();
                    var element = {};

                    element.currentDate=currentDate;
                    element.attend=attend;
                    logging.push(element);
                    console.log("logging : ");
                    console.log(logging);
                    console.log(indexofmeeting);
                    if(indexofmeeting!==-1){
                      obj1[indexofmeeting]={meetingId,meetingname,totalparticipantsofclass,logging};
                    }else{
                      obj1.push({meetingId,meetingname,totalparticipantsofclass,logging});
                    }
                    console.log(obj1);
                    var jsonObj = {};
                    jsonObj.classarray=obj1;
                    console.log(jsonObj);

                    chrome.storage.sync.set(jsonObj, function() {
                        console.log("Saved a new array item");
                    });
                });
            }
            else if (action === "save") {
              chrome.storage.sync.get(['classarray'], function(result) {
                console.log(result.classarray);
              });
                status=0;
                sendData();
                sendResponse("Downloading");
            }else if (action === "savefinal"){
                status=1;
                sendData();
                sendResponse("Downloading");
            }
            else if (action === "clear") {
              if(confirm("Are you sure you want to delete everything ?")==true){
                chrome.storage.sync.clear();
                clearData();
                sendResponse("Cleared");
            }
          }
        }
        else {
          chrome.storage.sync.set({status:0});
          alert("Service not available. Error: Not a valid Meeting.")
          console.log("Not Starting Service. Because it is not a Meeting.");
          sendResponse("Not a Meeting");
        }
        response("Received by Content Script");
    }
});

// Function to send data to Popup
function sendResponse(data) {
    chrome.runtime.sendMessage({ dist: "popup", data: data }, (res) => {
    });
}

// Function to send data to Background script
function sendData() {
    chrome.runtime.sendMessage({ dist: "background", dataValues: dataStorage, attend:attend, status:status ,participantNames: participantNames, timeValues: timeStamp, meetingId: meetingId,meetingname:meetingname }, res => {

    });
    console.log('data sent');
}
function opentab(){
  chrome.runtime.sendMessage({ dist: "opentab",meetingId: meetingId,meetingname:meetingname}, res => {
  });
}
