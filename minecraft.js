const os = require("os");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");

const winUsername = os.userInfo().username;
let baseURL = "https://rubugvkrwjee.mestermc.hu/"; 
let oneTwelveTwo = `C:\\Users\\${winUsername}\\AppData\\Roaming\\.MesterMC.hu`;
let versions = ["jar186", "jar"/*112.2*/, "jar116"];
let mmcfolders = ["_186", "", "_116"];
let mcversions = ["1.8.6", "1.12", "1.16.5"];
let missingFiles;
let allFiles;
let forgekFileCheck;
let filecheck;
let ffile;
let mmcfolder;

async function checkFiles() {
    allFiles = 0;
    missingFiles = 100;
    for(let i = 0; i<versions.length;i++) {
        forgekFileCheck = await fetch(`${baseURL}${versions[i]}/forgefilecheck`, {method: "GET"});
        filecheck = await forgekFileCheck.text();
        ffile = filecheck.split("\n");
        mmcfolder = oneTwelveTwo + mmcfolders[i];
        for(let z = 0; z<ffile.length;z++) {
            if(ffile[z].includes(".exe=") || ffile[z].includes(".zip=")) {
                const file = ffile[z].split("=")[0];
                if(!fs.existsSync(mmcfolder + `/${file}`)) missingFiles -= 1;
                allFiles+=1;
            }
        }
    }
    if(missingFiles < 100) {
        missingFiles = (100-missingFiles);
        downloadFiles();
    } else {
        missingFiles = 0;
    }
    console.log(`Missing files: ${missingFiles}`);
    console.log(`All files: ${allFiles}`);
}

async function downloadFiles() {
    for(let i = 0; i<versions.length;i++) {
        forgekFileCheck = await fetch(`${baseURL}${versions[i]}/forgefilecheck`, {method: "GET"});
        filecheck = await forgekFileCheck.text();
        ffile = filecheck.split("\n");
        mmcfolder = oneTwelveTwo + mmcfolders[i];
        for(let z = 0; z<ffile.length;z++) {
            if(ffile[z].includes(".exe=") || ffile[z].includes(".zip=")) {
                const file = ffile[z].split("=")[0];
                if(!fs.existsSync(mmcfolder + `/${file}`)) {
                    console.log(`Downloading ${mcversions[i]} ${file} in ${mmcfolder}`);
                    const resp = await fetch(`${baseURL}/${versions[i]}/${file}`);
                    const filecont = await resp.arrayBuffer();
                    const bufferFile = Buffer.from(filecont);
                    await fs.promises.appendFile(path.join(mmcfolder, `${file}`), bufferFile, { recursive: true }).then(()=>{
                        console.log(`Downloaded ${mcversions[i]} ${file} successfully in ${mmcfolder}`);
                        missingFiles--;
                        if(file.includes(".zip")) {
                            console.log(`Unzipping  ${mcversions[i]} ${file} in ${mmcfolder}...`);
                            unZipFiles(mmcfolder, ffile, mcversions[i], file);
                        }
                    });
                } else {
                    console.log(`${mcversions[i]} ${file} is already downloaded in ${mmcfolder}`);
                }
            }
        }
    }
}

async function unZipFiles(mmcfolder, ffile, mcversion, file) {
    for(let i = 0; i<ffile.length;i++) {
        if(ffile[i].includes("EXTRACT") && ffile[i].includes(mcversion) && ffile[i].includes(file)) {
            const task = JSON.parse(ffile[i]);
            const directory = await unzipper.Open.file(path.join(mmcfolder, task.file));
            await directory.extract({path: path.join(mmcfolder, task.path)});
            console.log(`${mcversion} ${task.file} extracted in ..${path.join(mmcfolder, task.path).split("AppData")[1]} from ${mmcfolder.split("AppData")[1]}`);
        }
    }
}

function getPercentage() {
    if(allFiles === 0) return {
        all: 999,
        downloaded: 20
    };
    return {
        all: allFiles,
        downloaded: (allFiles-missingFiles)
    }
}

function startMC(username, version) {
    for(let i = 0; i<versions.length;i++) {
        if(mcversions[i].includes(version)) {
            checkFiles();
        }
    }
}

module.exports = { checkFiles, getPercentage, startMC };
