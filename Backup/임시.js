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