// Electron 관련 모듈 불러오기

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const JGDownloader = require('./JGDownloader.js.bak');

// 전역 변수 선언
let mainWindow;
let isCanceled = false;
let isPaused = false;

/**
 * 메인 윈도우를 생성하는 함수
 */
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
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(createMainWindow);

// 앱 종료 이벤트 핸들러
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 앱 활성화 이벤트 핸들러
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

/**
 * IPC 이벤트 핸들러: 'action' 이벤트 처리
 * @param {Event} event - IPC 이벤트 객체
 * @param {string} action - 수행할 액션
 */
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

    const downloder = new JGDownloader(mainWindow);
    const url  = downloder.getDownloadLink('https://jav.guru/625427/mida-008-taming-a-cold-sugar-baby-revenge-thrusting-and-sloppy-kisses-turn-her-into-my-cum-covered-maid-overnight-miyashita-rena/');
    console.log(url);
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

/**
 * 파일 다운로드 함수
 * @param {string} fileUrl - 다운로드할 파일의 URL
 * @param {string} filePath - 저장될 파일 경로
 * @returns {Promise<void>}
 */
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