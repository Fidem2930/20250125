const urlInput = document.getElementById('urlInput');

// 버튼 요소들 가져오기
const addButton = document.getElementById('addButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const cancelButton = document.getElementById('cancelButton');
const downloadButton = document.getElementById('downloadButton');

// 버튼 클릭 이벤트 처리 함수
function handleButtonClick(action) {
    window.electron.send('action', action);
}

// 버튼 클릭 이벤트 리스너
addButton.addEventListener(
    'click',
    () => {
        const url = urlInput.value;
        window.electron.send('action', 'add', { url });
    }
);
pauseButton.addEventListener('click', () => handleButtonClick('pause'));
resumeButton.addEventListener('click', () => handleButtonClick('resume'));
cancelButton.addEventListener('click', () => handleButtonClick('cancel'));
downloadButton.addEventListener('click', () => handleButtonClick('download'));

// IPC 응답 리스너
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
        console.log(downloads);
    }
);

// 액션 전송 예시
function sendAction(action) {
    window.electron.send('action', action);
}
