const { BrowserWindow, app, ipcMain, dialog } = require('electron');
const path = require("path");
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require("fs");
const { checkFiles, getPercentage, startMC } = require("./minecraft");

let updateWindow;
let mainWindow;
let percentage = 0;
let currentVersion = "1.1.3";
let uptodate;

function createUpdateWindow() {
    updateWindow = new BrowserWindow({
        title: "MesterMC electron.js kliens by Serwenyi",
        height: 600,
        width: 810,
        icon: path.join(__dirname, "app/img/mestermc-logo.png"),
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });
    updateWindow.loadFile(path.join(__dirname, "app/update/update.html"));
    updateWindow.removeMenu();
}

app.on("ready", () => {
    createUpdateWindow();
});

app.on("window-all-closed", () => {
    app.quit();
});

ipcMain.on("check-update", async (event)=> {
    try {
        const checkUpdate = await axios.get("https://raw.githubusercontent.com/SerwenyiW/MesterMC-eJS-Kliens/main/versions.txt");
        const firstline = checkUpdate.data.split("\n")[0];
        const updateVersion = firstline.split(": ")[1];
        if(updateVersion === currentVersion) {
            event.reply("up-to-date", "A kliens naprakész!", true);
            uptodate = true;
        } else {
            event.reply("up-to-date", "Frissítés érhető el!\nKattins ide!", false);
            uptodate = false;
        }
    } catch (err) {
        event.reply("up-to-date", "Valamilyen hiba történt...", false);
    }
});

ipcMain.on("open-main-window", () => {
    if(percentage < 100 || !uptodate) return;
    if(updateWindow) updateWindow.close();
    if(!mainWindow) createMainWindow();
});

ipcMain.on("welcome-message", async (event)=> {
    try {
        const resp = await axios.get("https://rubugvkrwjee.mestermc.hu/hatterkep/updatenotes.txt");
        event.reply("welcome-reply", Buffer.from(resp.data, 'base64').toString('utf-8'));
    } catch(err) {
        event.reply("welcome-reply", 'Hiba történt...\nMindegy, szép napot!:)');
    }
});

ipcMain.on("start-progress", async (event)=>{
    checkFiles();
    var progint = setInterval(()=>{
        if(percentage < 100) {
            percentage = (getPercentage().downloaded / getPercentage().all * 100).toFixed(1);
            event.reply("progress", percentage);
        } else clearInterval(progint);
    }, 1000);
});


//Main window //

let newsIndex = 0;
let newsItem = [];
let usernames = [];
let lastSelected;
let loginClicked = Date.now() + 3000;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "MesterMC electron.js kliens by Serwenyi",
        height: 450,
        width: 950,
        icon: path.join(__dirname, "app/img/mestermc-logo.png"),
        resizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });
    mainWindow.loadFile(path.join(__dirname, "app/main/main.html"));
    mainWindow.removeMenu();
}

ipcMain.on("initMain", async (event)=>{
    try {
        const respMMC = await fetch("https://rubugvkrwjee.mestermc.hu/hatterkep/hirek.xml", {method: "GET"});
        const xmlStringMMC = await respMMC.text();
        xml2js.parseString(xmlStringMMC, (err, result)=>{
            const mestermcnews = result.mestermcnews;
            const maintitle = mestermcnews.title; 
            const items = mestermcnews.item;
            items.forEach((item)=>{
                const content = typeof item.content === 'string' ? item.content : item.content.toString();
                const title = item.title;
                const link = item.link;
                const img = item.img;
                const intro = content.split("\r\n")[0];
                const details = content.split("\r\n")[2] + content.split("\n")[3];
                newsItem.push({maintitle: maintitle, title: title, link: link, img: img, intro: [intro], content: [details]});
            });
        });
        const respGitHub = await fetch("https://raw.githubusercontent.com/SerwenyiW/MesterMC-eJS-Kliens/main/hirek.xml", {method: "GET"});
        const xmlStringGitHub = await respGitHub.text();
        xml2js.parseString(xmlStringGitHub, (err, result)=>{
            const sermestermc = result.serwmestermc;
            const maintitle = sermestermc.title;
            const items = sermestermc.item;
            items.forEach((item)=>{
                const title = item.title;
                const img = item.img;
                const link = item.link;
                const intro = item.intro;
                const content = item.content;
                newsItem.push({maintitle: maintitle, title: title, link: link, img: img, intro: intro, content: content});
            });
        });
        event.reply("news", newsItem[0].maintitle, newsItem[0].title, newsItem[0].link, newsItem[0].img, newsItem[0].intro, newsItem[0].content, newsIndex+1, newsItem.length);

        const directoryPath = "C:\\MesterMCkliens";
        const usernamespro = path.join(directoryPath, "usernames.properties");
        if(!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
        if(!fs.existsSync(usernamespro)) fs.writeFileSync(usernamespro, '');
        const data = fs.readFileSync(usernamespro, 'utf8');
        data.split(/\r?\n/).forEach((line)=>{
            if(line.includes("usernames")) {
                const usernamesLine = line.split("usernames=").join("").split(";");
                for(let i = 0; i<usernamesLine.length;i++) {
                    if(usernamesLine[i] !== "") usernames.push(usernamesLine[i]);
                }
            }
            if(line.includes("lastSelected")) lastSelected = line.split("lastSelected=")[1];
        });
        for(let i = 0; i<usernames.length;i++) {
            event.reply("getUsers-reply", lastSelected, usernames[i]);
        }
    } catch (err) {throw err;}
});

ipcMain.on("swipe", (event, side)=>{
    if(side === "right") {
        if(newsIndex === (newsItem.length-1)) {
            newsIndex = 0;
        } else {
            newsIndex += 1;
        }
    } else if(side === "left") {
        if(newsIndex === 0) {
            newsIndex = (newsItem.length-1);
        } else {
            newsIndex -= 1;
        }
    }
    const maintitle = newsItem[newsIndex].maintitle;
    const title = newsItem[newsIndex].title;
    const img = newsItem[newsIndex].img;
    const link = newsItem[newsIndex].link;
    const intro = newsItem[newsIndex].intro;
    const content = newsItem[newsIndex].content;
    event.reply("news", maintitle, title, link, img, intro, content, newsIndex+1, newsItem.length);
});

ipcMain.on("login", async(event, username, password, version)=>{
    if(Date.now() >= loginClicked) {
        startMC(username,version);
        loginClicked = Date.now() + 3000; 
        dialog.showMessageBox({
            icon: path.join(__dirname, "app/img/mestermc-logo.png"),
            title: "MesterMC electron.js kliens",
            message: "Jelenleg nincs MMC-Auth login, de valószínűleg sohasem lesz publikálva!:)"
        });
    }
});

ipcMain.on("exit", ()=>{
    app.quit();
});
