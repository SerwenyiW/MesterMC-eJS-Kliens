const { shell, ipcRenderer } = require('electron');
var newsContainer = document.getElementById("newsContainer");
var newsPage = document.getElementById("newsPage");
var closeBtn = document.getElementById("closeBtn");
var username = document.getElementById("username");
var password = document.getElementById("password");
var usersList = document.getElementById("users");
var versionSelect = document.getElementById("versionSelect");
var loginBtn = document.getElementById("loginBtn");

ipcRenderer.send("initMain");

loginBtn.addEventListener("click", ()=>{
    if(username.value === "" || password.value === "") return;
    ipcRenderer.send("login", username.value, password.value, versionSelect.value);
});

ipcRenderer.on("news", (event, maintitle, title, link, img, intro, content, index, maxIndex)=>{
    newsContainer.innerHTML = `
        <h1>${maintitle}</h1>
        <p style="color: orange;">${title}</p>
        <img style="cursor: pointer;" height="120px" src="${img}" width="430px" onclick="openURL('${link}');"></img>
        <p style="margin: 0; font-size: 17px">${intro}</p>
        <p style="margin-left: 5px; font-size: 15px; margin-right: 25px;">${content}</p>
    `;
    newsPage.innerText = `${index}/${maxIndex}`
});

ipcRenderer.send("getUsers");
ipcRenderer.on("getUsers-reply", (event, inputValue, users)=>{
    username.setAttribute("value", inputValue);
    usersList.innerHTML += `<option value='${users}'></option>`;
});

function swipeNews(side) {
    ipcRenderer.send("swipe", side);
}

closeBtn.addEventListener('click', ()=>{
    ipcRenderer.send("exit");
});

function openURL(url) {
    shell.openExternal(url);
}