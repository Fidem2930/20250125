const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const JGDownloader = require('./JGDownloader.js');

let mainWindow = null;
let downloader = null;
let isCanceled = false;
let isPaused = false;

/*
https://jav.guru/630272/dldss-385-a-busty-married-woman-stuck-in-a-sexless-marriage-falls-in-pure-love-with-the-younger-handsome-therapist-at-a-women-only-escort-service-yuko-ono/
*/

async function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1800,
        height: 1000,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();

    // for Test
    downloader = new JGDownloader(mainWindow);

}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

ipcMain.on('action', (event, action, data) => {
    switch (action) {
        case 'add':            
            handleAddDownload(data);
            break;
        case 'pause':
            handlePauseDownload();
            break;
        case 'resume':
            handleResumeDownload();
            break;
        case 'cancel':
            handleCancelDownload();
            break;
        case 'download':
            handleStartDownload();
            break;
        default:
            break;
    }
});

async function handleAddDownload(data) {
    if (!downloader) {
        console.log('Downloader Initialization Failure');
        return;
    }

    /*
    if (data.url === '') {
        data.url = 'https://jav.guru/630272/dldss-385-a-busty-married-woman-stuck-in-a-sexless-marriage-falls-in-pure-love-with-the-younger-handsome-therapist-at-a-women-only-escort-service-yuko-ono/';
    }

    if (!downloader.checkUrl(data.url)) {
        console.log('Invalid URL');
        return;
    }

    const download = await downloader.getDownloadUrl(data.url);
    if (!download.result) {
        console.log(`Failure Step ${download.step}`);
        return;
    }

    console.log('Download Filename: ', download.filename);
    console.log('Download URL: ', download.url);
    */

    /*
        Download Filename:  DLDSS-385.mp4
        Download URL:  https://streamtape.xyz/get_video?id=DPg7MyjD2qiky3J&expires=1738303915&ip=F0SQKRWOE19XKxR&token=M6XFMszzL-NG
    */

    const url = 'https://streamtape.xyz/get_video?id=DPg7MyjD2qiky3J&expires=1738303915&ip=F0SQKRWOE19XKxR&token=M6XFMszzL-NG';
    const filename = 'DLDSS-385.mp4';

    downloader.startDownlaod(url, filename, filename);
}

function handlePauseDownload() {
    isPaused = true;
    console.info('Pause Download');;
    mainWindow.webContents.send('status', '다운로드 일시정지됨');
}

function handleResumeDownload() {
    isPaused = false;
    console.info('Resume Download');
    mainWindow.webContents.send('status', '다운로드 재개됨');
}

function handleCancelDownload() {
    isCanceled = true;
    console.warn('Cancel Download');
    mainWindow.webContents.send('status', '다운로드 취소됨');
}

function handleStartDownload() {
    console.info('Start Download');
    mainWindow.webContents.send('status', '다운로드 시작됨');
}
