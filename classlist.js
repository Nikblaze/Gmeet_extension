
chrome.storage.sync.get(['classarray'], function(result) {
  let obj=[];
  if(result.classarray===undefined){
    alert("Seems like vacation! No classes saved.");
  }
  else{
   let select = document.getElementById("classlist");
    obj=result.classarray;
    let i;
    for(i=0;i<obj.length;i++){
      let opt=obj[i].meetingId.substring(0,12)+'_'+obj[i].meetingname;
      console.log(opt);
      let el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      select.appendChild(el);
    }
  }
});

let val;
document.getElementById('classlist').addEventListener('change', function() {
  val=this.value;
  console.log('You selected: ', val);
});
let btn = document.getElementById("download");
btn.addEventListener("click", function() {
    console.log("into the classlist js");
    sendData();
});
btn = document.getElementById("deleteclass");
btn.addEventListener("click", function() {
    console.log("requested for delete");
    if(confirm("Are you sure you want to delete the class?")==true){
    console.log("confimed ");
    chrome.storage.sync.get(['classarray'], function(result) {
      let dataofthismeeting=-1;
      for(index of result.classarray){
        if(index.meetingId.substring(0,12)===val.substring(0,12)){
          dataofthismeeting=index;
          break;
        }
      }
      if(dataofthismeeting===-1) alert("Not a valid class");
      else{
      //deleting the selected class
    result.classarray.splice(dataofthismeeting, 1);
    chrome.storage.sync.set(result, function() {
        alert('Class deleted!');
    });
    setTimeout(function(){
      chrome.tabs.reload(function(){});
    }, 2000);
  }
});

    }
    else{
      console.log("cancelled");
    }
});
function sendData() {
    chrome.runtime.sendMessage({ dist: "classlist",text:val}, res => {
    });
    console.log('classlist: data sent');
}
