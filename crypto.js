import CryptoJS from 'crypto-js';

function encryptAES(data, salt) {
    if (!salt) {
        return data;
    }
    var encrypted = getAESEnc(ramdomString(64) + data, salt, ramdomString(16));
    return encrypted;
}

function getAESEnc(data, key0, iv0) {
    key0 = key0.replace(/(^\s+)|(\s+$)/g, "");
    var key = CryptoJS.enc.Utf8.parse(key0);
    var iv = CryptoJS.enc.Utf8.parse(iv0);
    var encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

function ramdomString(len) {
    const $_chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    const _chars_len = $_chars.length;
    let retStr = '';
    for (let i = 0; i < len; i++) {
        retStr += $_chars.charAt(Math.floor(Math.random() * _chars_len));
    }
    return retStr;
}
export default encryptAES
