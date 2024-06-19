const { shell, ipcRenderer } = require('electron');

var welcomeMess = document.getElementById("welcomeMess");
var cupdate = document.getElementById("checkUpdate");
var progressBar = document.getElementById("progressBar");
var startBtn = document.getElementById("startBtn");
var closeBtn = document.getElementById("closeBtn")

closeBtn.addEventListener('click', ()=>{
    ipcRenderer.send("exit");
});

ipcRenderer.send("welcome-message");
ipcRenderer.on("welcome-reply", (event, message)=>{
    welcomeMess.innerText = message;
});

ipcRenderer.send("start-progress");
ipcRenderer.on("progress", (event, message)=>{
    progressBar.setAttribute("loading-text", `${message}%`);
    progressBar.setAttribute("value", message);
});

ipcRenderer.send("check-update");
ipcRenderer.on("up-to-date", (event, message, utd)=>{
    cupdate.innerText = message;
    if(!utd) {
        cupdate.style.cursor = "pointer";
        cupdate.addEventListener("click", ()=>{
            openURL("https://github.com/SerwenyiW/MesterMC-eJS-Kliens/tree/main");
        });
        startBtn.src = "../img/play-btn-disabled.png";
    } else {
        startBtn.src = "../img/play-btn-normal.png"
        startBtn.addEventListener("click", ()=>{
            ipcRenderer.send("open-main-window");
            startBtn.src = "../img/play-btn-active.png";
        });
    }
});

function openURL(url) {
    shell.openExternal(url);
}