const urlInput = document.getElementById('urlInput');

// 버튼 요소들 가져오기
const addButton = document.getElementById('addButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const cancelButton = document.getElementById('cancelButton');
const downloadButton = document.getElementById('downloadButton');

// 리스너 관리를 위한 Map
const buttonListeners = new Map();

function disableButton(button, duration = 1000) {
    button.disabled = true;
    setTimeout(() => {
        button.disabled = false;
    }, duration);
}

function addItem(id, title) {
    const downloadList = document.querySelector('tbody');
    const newDownloadItem = document.createElement('tr');

    // ID 속성 추가
    newDownloadItem.id = `download-${id}`;
    newDownloadItem.innerHTML = `
        <td class="text-start align-middle text-truncate" style="max-width: 200px; id="title-${id}">
            ${title}
        </td>
        <td class="align-middle">
            <span class="badge bg-warning text-dark" id="status-${id}">Pending</span>
        </td>
        <td class="align-middle">
            <div class="progress">
                <div class="progress-bar bg-warning" role="progressbar" 
                    id="progress-${id}"
                    style="width: 30%;" 
                    aria-valuenow="30" 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                </div>
            </div>
        </td>
        <td class="align-middle">
            <button class="btn btn-outline-warning btn-sm" id="btn-${id}">Start</button>
        </td>
    `;
    downloadList.appendChild(newDownloadItem);

    const button = document.querySelector(`#btn-${id}`);
    const clickHandler = () => {

        const item = document.querySelector(`#download-${id}`);
        if (!item)
            return;

        const status = document.querySelector(`#status-${id}`);
        const progressBar = document.querySelector(`#progress-${id}`);
        if (!status || !progressBar)
            return;

        if (button.textContent === 'Start') {
            button.textContent = 'Pause';
            button.classList.replace('btn-outline-warning', 'btn-outline-primary');
            status.textContent = 'Downloading';
            status.classList.replace('bg-warning', 'bg-primary');
            progressBar.classList.replace('bg-warning', 'bg-primary');
            // 다운로드 시작 액션
            window.electron.send('action', 'start', { id });
        } else if (button.textContent === 'Pause') {
            button.textContent = 'Resume';
            button.classList.replace('btn-outline-primary', 'btn-outline-secondary');
            status.textContent = 'Paused';
            status.classList.replace('bg-primary', 'bg-secondary');
            progressBar.classList.replace('bg-primary', 'bg-secondary');
            // 다운로드 일시정지 액션
            window.electron.send('action', 'pause', { id });
        } else {
            button.textContent = 'Pause';
            button.classList.replace('btn-outline-secondary', 'btn-outline-primary');
            status.textContent = 'Downloading';
            status.classList.replace('bg-secondary', 'bg-primary');
            progressBar.classList.replace('bg-secondary', 'bg-primary');
            // 다운로드 재개 액션
            window.electron.send('action', 'resume', { id });
        }
    };

    button.addEventListener('click', clickHandler);
    buttonListeners.set(id, clickHandler);
}

function delItem(id) {
    const item = document.querySelector(`#download-${id}`);
    const button = document.querySelector(`#btn-${id}`);
    
    if (item && button) {
        const listener = buttonListeners.get(id);
        if (listener) {
            button.removeEventListener('click', listener);
            buttonListeners.delete(id);
        }
        item.remove();
    }
}

addButton.addEventListener(
    'click',
    () => {
        disableButton(addButton);
        const url = urlInput.value;
        window.electron.send('action', 'add', { url });
    }
);

window.electron.receive(
    'status',
    (status) => {
        console.log('다운로드 상태:', status);
        // 여기서 UI 업데이트 로직을 추가할 수 있습니다
    }
);

window.electron.receive(
    'downloadChanged',
    (downloads) => {
        console.log('downloadChanged: ');
        for (const download of downloads) {
            switch (download.status) {
                case 'Add':
                    console.log(`[${download.id}] Add`);
                    addItem(download.id, download.filename);
                    break;
                case 'Cancel':
                    break;
                case 'Download':
                    console.log(`[${download.id}] Download: ${download.process}%`);
                    const progressBar = document.querySelector(`#progress-${download.id}`);
                    if (progressBar) {
                        progressBar.style.width = `${download.process}%`;
                        progressBar.setAttribute('aria-valuenow', download.process);
                    }
                    break;
                case 'Pause':
                    break;
                default:
                    break;
            }
        }
    }
);

pauseButton.addEventListener('click', () => {
    disableButton(pauseButton);
    console.log('Pause Button Clicked');
});

resumeButton.addEventListener('click', () => {
    disableButton(resumeButton);
    console.log('Resume Button Clicked');
});

cancelButton.addEventListener('click', () => {
    disableButton(cancelButton);
    console.log('Cancel Button Clicked');
});

downloadButton.addEventListener('click', () => {
    disableButton(downloadButton);
    console.log('Download Button Clicked');
});

function sendAction(action) {
    window.electron.send('action', action);
}
