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

    /*
    const downloder = new JGDownloader(mainWindow);
    const url = downloder.getDownloadLink('https://jav.guru/625427/mida-008-taming-a-cold-sugar-baby-revenge-thrusting-and-sloppy-kisses-turn-her-into-my-cum-covered-maid-overnight-miyashita-rena/');
    console.log(url);
    */
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

async function downloadFile(fileUrl, filePath) {
    try {
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream',
        });

        const fileStream = fs.createWriteStream(filePath);
        response.data.pipe(fileStream);

        let downloadedSize = 0;
        const totalSize = response.headers['content-length'];

        response.data.on('data', (chunk) => {
            if (!isPaused) {
                downloadedSize += chunk.length;
                const progress = (downloadedSize / totalSize) * 100;
                updateProgress(progress);
            }
        });

        await new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                if (!isCanceled) {
                    resolve();
                } else {
                    reject(new Error('Download canceled'));
                }
            });
            fileStream.on('error', reject);
        });

        if (isCanceled) {
            fileStream.destroy();
            throw new Error('Download canceled');
        }
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

function updateProgress(progress) {
    // 진행률 업데이트 로직 구현
}