const fs = require('fs');
const path = require('path');
const axios = require('axios');
const uuid = require('uuid');
const { JSDOM } = require('jsdom');

class JGDownloader {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.downloads = new Map();

        this.startDownlaod();
    }

    async getData(url, type) {
        let response = {};
        let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
        try {
            switch (type) {
                case 0:
                    response = await axios.post(url, {}, {
                        headers: {
                            "User-Agent": userAgent,
                            "Dnt": "1",
                            "Referer": "https://jav.guru/",
                            "Sec-Fetch-Dest": "iframe",
                            "Sec-Fetch-Mode": "navigate",
                            "Connection": "keep-alive",
                        }
                    });
                    break;
                case 1:
                    response = await axios.get(url, {
                        headers: {
                            "User-Agent": userAgent,
                            "Dnt": "1",
                            "Connection": "keep-alive",
                        }
                    });
                    break;
                case 2:
                    response = await axios.head(url, {
                        headers: {
                            "User-Agent": userAgent,
                            "Dnt": "1",
                            "Cache-Control": "no-cache"
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error(error);
            return {
                result: false
            }
        }
        return {
            result: true,
            data: response
        }
    }

    checkHtml(text) {
        const regex = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
        const doctype = /<!DOCTYPE html>/i;
        const comment = /<!--[\s\S]*?-->/;
        return regex.test(text) || doctype.test(text) || comment.test(text);
    }

    checkUrl(text) {
        const pattern = new RegExp('^(https?:\\/\\/)?' + // 프로토콜
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // 도메인명
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // IP 주소
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // 포트 및 경로
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // 쿼리 스트링
            '(\\#[-a-z\\d_]*)?$', 'i'); // 프래그먼트 식별자
        return !!pattern.test(text);
    }

    // JavGuru 관련
    checkStreamTapeButton(text) {
        const dom = new JSDOM(text);
        const doc = dom.window.document;
        const tag = doc.querySelectorAll("a");
        for (let i = 0; i < tag.length; i++) {
            const html = tag[i].innerHTML;
            if (html.includes("STREAM ST")) {
                return true;
            }
        }
        return false;
    }

    getStreamTapeDR(url) {
        const match = url.match(/(?<=dd=)[^&]*/);
        if (match) {
            const dd = match[0];
            return {
                result: true,
                dr: dd.split('').reverse().join('')
            };
        }
        return {
            result: false
        };
    }

    /*
    getStreamTapeFrameUrl(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const tagElements = document.querySelectorAll("a");
        for (let i = 0; i < tagElements.length; i++) {
            const tagHtml = tagElements[i].innerHTML;
            if (tagHtml.includes("STREAM ST")) {
                const idString = tagElements[i].getAttribute("data-localize");
                const extraElement = document.getElementById("wp-btn-iframe-js-extra");
                if (extraElement) {
                    const extraHtmlString = extraElement.innerHTML;
                    const extraHtmlStringArray = extraHtmlString.split("\n");
                    const extraElementString = extraHtmlStringArray.find(line => line.includes(idString));
                    if (extraElementString) {
                        let extraDictString = extraElementString;
                        extraDictString = extraDictString.replace(`var ${idString} = `, "");
                        extraDictString = extraDictString.replace("};", "}");
                        try {
                            const extraDict = JSON.parse(extraDictString);
                            if (extraDict.iframe_url) {
                                const decodedUrl = Buffer.from(extraDict.iframe_url, 'base64').toString('utf-8');
                                return {
                                    result: true,
                                    url: decodedUrl
                                };
                            }
                        } catch (error) {
                            return {
                                result: false
                            };
                        }
                    }
                }
            }
        }
        return {
            result: false
        };
    }
    */

    getStreamTapeVideoToken(html) {
        const TOKEN_PATTERN = /document\.getElementById\('norobotlink'\)\.innerHTML\s*=\s*'.*token=([A-Za-z0-9_\-]+)'/;
        const match = html.match(TOKEN_PATTERN);
        return match ? match[1] : '';
    }

    getStreamTapeVideoInfix(html) {
        const URL_PATTERN = /<div id="ideoooolink"[^>]*>([^<]+)/;
        const match = html.match(URL_PATTERN);
        if (match && match[1]) {
            const urlString = `https:/${match[1]}`;
            try {
                const url = new URL(urlString);
                url.searchParams.delete('token');
                return url.toString();
            } catch (error) {
                console.error('URL parsing failed:', error.message);
                return '';
            }
        }
        return '';
    }

    getStreamTapeVideoRequestUrl(infixString, tokenString) {
        return `${infixString}&token=${tokenString}`;
    }
    getStreamTapeFrameUrl(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const tagElements = document.querySelectorAll("a");
        const extraElement = document.getElementById("wp-btn-iframe-js-extra");

        if (!extraElement) {
            return { result: false };
        }

        const extraHtmlString = extraElement.innerHTML;
        const extraHtmlStringArray = extraHtmlString.split("\n");
        const idStringRegex = /data-localize="([^"]+)"/;

        for (let i = 0; i < tagElements.length; i++) {
            const tagHtml = tagElements[i].innerHTML;
            if (tagHtml.includes("STREAM ST")) {
                const match = tagElements[i].outerHTML.match(idStringRegex);
                if (match) {
                    const idString = match[1];
                    const extraElementString = extraHtmlStringArray.find(line => line.includes(idString));
                    if (extraElementString) {
                        let extraDictString = extraElementString.replace(`var ${idString} = `, "").replace("};", "}");
                        try {
                            const extraDict = JSON.parse(extraDictString);
                            if (extraDict.iframe_url) {
                                const decodedUrl = Buffer.from(extraDict.iframe_url, 'base64').toString('utf-8');
                                return { result: true, url: decodedUrl };
                            }
                        } catch (error) {
                            return { result: false };
                        }
                    }
                }
            }
        }

        return { result: false };
    }

    async getStreamTapeUrl(html) {
        const frameUrl = await this.getStreamTapeFrameUrl(html);
        if (frameUrl.result) {
            const url = frameUrl.url;
            if (url.includes('https://jav.guru/searcho/')) {
                const dr = this.getStreamTapeDR(url);
                if (dr.result) {
                    return {
                        result: true,
                        url: `https://jav.guru/searcho/?dr=${dr.dr}`
                    };
                }
            }
            return {
                result: true,
                url: url
            };
        }
        return {
            result: false
        };
    }

    async getDownloadUrl() {
        const url = 'https://jav.guru/629439/apgh-030-after-school-beautiful-girl-h-slim-and-fair-skinned-french-quarter-student-noa-gentle-girl-gets-wild-on-top-hotel-stay-hidden-camera-date-momosa-noa/';

        // Step 1: Get Page Data
        const pageData = await this.getData(url, 1);
        if (!pageData.result) {
            console.log('Step 1 Failed');
            return {
                step: 1,
                result: false
            };
        }

        console.log('Step 1 Success');

        // Step 2: Get Page Html
        const pageHtml = pageData.data.data
        if (!this.checkHtml(pageHtml)) {
            console.log('Step 2 Failed');
            return {
                step: 2,
                result: false
            };
        }

        console.log('Step 2 Success');

        // Step 3: Check StreamTape Button
        const isStreamTapeButton = this.checkStreamTapeButton(pageHtml);
        if (!isStreamTapeButton) {
            console.log('Step 3 Failed');
            return {
                step: 3,
                result: false
            };
        }

        console.log('Step 3 Success');

        // Step 4: Get Temporary StreamTape URL
        const tempStreamTapeUrl = await this.getStreamTapeUrl(pageHtml);
        if (!tempStreamTapeUrl.result) {
            console.log('Step 4 Failed');
            return {
                step: 4,
                result: false
            };
        }

        console.log('Step 4 Success');
        console.log('URL:', tempStreamTapeUrl.url);

        // Step 5: Get Temporary StreamTape Data
        const tempStreamTapeData = await this.getData(tempStreamTapeUrl.url, 0);
        if (!tempStreamTapeData.result) {
            console.log('Step 5 Failed');
            return {
                step: 5,
                result: false
            };
        }

        console.log('Step 5 Success');

        // Step 6: Get StreamTape Embed URL
        const streamTapeEmbedUrl = tempStreamTapeData.data.request._redirectable?._currentUrl;
        if (!streamTapeEmbedUrl) {
            console.log('Step 6 Failed');
            return {
                step: 6,
                result: false
            };
        }

        console.log('Step 6 Success');
        console.log('URL: ', streamTapeEmbedUrl);

        // Step 7: Get StreamTape Video URL
        const streamTapeVideoUrl = streamTapeEmbedUrl.replace('/e/', '/v/');
        if (!streamTapeVideoUrl) {
            console.log('Step 7 Failed');
            return {
                step: 7,
                result: false
            };
        }

        console.log('Step 7 Success');
        console.log('URL: ', streamTapeVideoUrl);

        // Step 8: Get StreamTape Video Data
        const streamTapeVideoData = await this.getData(streamTapeVideoUrl, 1);
        if (!streamTapeVideoData.result) {
            console.log('Step 8 Failed');
            return {
                step: 8,
                result: false
            };
        }

        console.log('Step 8 Success');

        // Step 9: Get StreamTape Video Html 
        const streamTapeVideoHtml = streamTapeVideoData.data.data;
        if (!this.checkHtml(streamTapeVideoHtml)) {
            console.log('Step 9 Failed');
            return {
                step: 8,
                result: false
            };
        }

        console.log('Step 9 Success');

        // Step 10: Get StreamTape Video Url
        const streamTapeVideoToken = this.getStreamTapeVideoToken(streamTapeVideoHtml);
        const streamTapeVideoInfix = this.getStreamTapeVideoInfix(streamTapeVideoHtml);
        const streamTapeVideoRequestUrl = this.getStreamTapeVideoRequestUrl(streamTapeVideoInfix, streamTapeVideoToken)
        if (!this.checkUrl(streamTapeVideoRequestUrl)) {
            console.log('Step 10 Failed');
            return {
                step: 10,
                result: false
            };
        }

        console.log('Step 10 Success');
        console.log('URL: ', streamTapeVideoRequestUrl);

        return {
            step: 10,
            result: true,
            url: streamTapeVideoRequestUrl
        };
    }

    // 다운로드 관련
    startDownlaod(url, path) {
        const downloadId = uuid.v4();
        console.log('Download ID: ', downloadId);
        const downloadPromise = new Promise(
            (resolve, reject) => {
                const cancelToken = axios.CancelToken.source();
                axios(
                    {
                        method: 'GET',
                        url: url,
                        responseType: 'stream',
                        cancelToken: cancelToken.token
                    }
                ).then(
                    response => {
                        const fileStream = fs.createWriteStream(path);
                        response.data.pipe(fileStream);

                        fileStream.on(
                            'finish', 
                            () => {
                                console.log('Download Complete');
                                this.downloads.delete(downloadId);
                                resolve();
                            }
                        );

                        fileStream.on(
                            'error',
                            (error) => {                                
                                console.log('Download Error');
                                this.downloads.delete(downloadId);
                                reject(error);
                            }
                        );

                        this.downloads.set(
                            downloadId,
                            {
                                promise: downloadPromise,
                                cancel: cancelToken.cancel,
                                fileStream: fileStream,
                                status: 'Download'
                            }
                        );
                    }
                ).catch(
                    error => {
                        reject(error);
                    }
                )
            }
        );
        return downloadId;
    }

    cancelDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (download && download.status !== 'Cancel') {
            download.cancel();
            download.fileStream.destroy();
            download.status = 'Cancel';
            this.downloads.delete(downloadId);
            console.log(`Download Cancel: ${downloadId}`);
        }
    }

    pauseDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (download && download.status === 'Download') {
            download.fileStream.pause();
            download.status = 'Pause';
            console.log(`Download Pause: ${downloadId}`);
        }
    }

    resumeDownload(downloadId) {
        const download = this.downloads.get(downloadId);
        if (download && download.status === 'Pause') {
            download.fileStream.resume();
            download.status = 'Download';
            console.log(`Download Resume: ${downloadId}`);
        }
    }
}

module.exports = JGDownloader;
