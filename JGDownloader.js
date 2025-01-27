const axios = require('axios');
const { JSDOM } = require('jsdom');

class JGDownloader {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
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

    // Jav.Guru 관련
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

    async getDownloadUrl() {
        let url = 'https://jav.guru/629439/apgh-030-after-school-beautiful-girl-h-slim-and-fair-skinned-french-quarter-student-noa-gentle-girl-gets-wild-on-top-hotel-stay-hidden-camera-date-momosa-noa/';

    }
}

module.exports = JGDownloader;
