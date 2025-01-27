const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const JGDownloader = require('./JGDownloader.js');

let mainWindow;
let isCanceled = false;
let isPaused = false;

function createMainWindow() {
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

    const downloader = new JGDownloader(mainWindow);
    //downloader.getDownloadUrl();
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

ipcMain.on('action', (event, action) => {
    switch (action) {
        case 'add':
            handleAddDownload();
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
            console.warn('[Download] 알 수 없는 액션:', { action });
    }
});

function handleAddDownload() {
    console.info('[Download] 다운로드 항목 추가');
    mainWindow.webContents.send('status', '다운로드 항목 추가');
}

function handlePauseDownload() {
    isPaused = true;
    console.info('[Download] 다운로드 일시정지');
    mainWindow.webContents.send('status', '다운로드 일시정지됨');
}

function handleResumeDownload() {
    isPaused = false;
    console.info('[Download] 다운로드 재개');
    mainWindow.webContents.send('status', '다운로드 재개됨');
}

function handleCancelDownload() {
    isCanceled = true;
    console.warn('[Download] 다운로드 취소');
    mainWindow.webContents.send('status', '다운로드 취소됨');
}

function handleStartDownload() {
    console.info('[Download] 다운로드 시작');
    mainWindow.webContents.send('status', '다운로드 시작됨');
}
