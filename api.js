import encryptAES from './crypto.js';
import fetch from 'node-fetch';

async function getLoginData(authURL) {
    const resp = await fetch(authURL)
    const respHTML = await resp.text()
    const pwdSalt = /.*<input type="hidden" id="pwdDefaultEncryptSalt" value="(\S+)"\/?>/.exec(respHTML)[1]
    const loginParams = Object.fromEntries([...(respHTML).matchAll(/<input type="hidden" name="(\S+)" value="(\S+)"\/?>$/gm)].map(m => [m[1], m[2]]))
    return ({
        getLoginParams: (username, password) => {
            return {...loginParams, ...{username: username, password: encryptAES(password, pwdSalt)}}
        },
        authHeaders: {'Cookie': resp.headers.get('set-cookie')},
    })
}

async function getLoginSSOResponse(authURL, username, password) {
    const data = await getLoginData(authURL);
    return await fetch(authURL, {
        method: 'POST',
        headers: data.authHeaders,
        body: new URLSearchParams(data.getLoginParams(username, password)),
        redirect: 'manual',
    });
}

async function ssoLoginForTokenURL(username, password, authURL='https://authserver.gdut.edu.cn/authserver/login?service=http%3A%2F%2Fjxfw.gdut.edu.cn%2Fnew%2FssoLogin') {
    const authResponse = await getLoginSSOResponse(authURL, username, password);
    if (authResponse.headers.has('Location')) {
        return authResponse.headers.get('Location');
    } else {
        throw new Error(
            (
                /<span id="msg" class="auth_error" style="top:-19px;">(.+)<\/span>/g
            ).exec(await authResponse.text())[1]
        );
    }
}

async function jxfwLogin(jxfwTokenURL) {
    const jxfwLoginResponse = await fetch(jxfwTokenURL, {
        redirect: 'manual',
    })
    const jxfwHeaders = {'Cookie': jxfwLoginResponse.headers.get('Set-Cookie')}
    await fetch(jxfwLoginResponse.headers.get('Location').replace('http://', 'https://'), {
        headers: jxfwHeaders,
        redirect: 'manual',
    })
    return ({
        jxfwHeaders: jxfwHeaders,
        getXnxqData: async (xnxqdm) => ({
            scheduleJSON: await getScheduleJSON(jxfwHeaders, xnxqdm),
            getFirstDayInSemester: async () => getFirstDayInSemester(jxfwHeaders, xnxqdm)
        }),
    })
}

async function getScheduleJSON(jxfwHeaders, xnxqdm) {
    return JSON.parse((await (await fetch('https://jxfw.gdut.edu.cn/xsgrkbcx!xsAllKbList.action?xnxqdm=' + xnxqdm, {
        headers: jxfwHeaders,
    })).text()).match(/var kbxx = (\[.*?]);/)[1])
}

async function getFirstDayInSemester(jxfwHeaders, xnxqdm) {
    return new Date(JSON.parse(await (await fetch('https://jxfw.gdut.edu.cn/xsgrkbcx!getKbRq.action?zc=1&xnxqdm=' + xnxqdm, {
        headers: jxfwHeaders,
    })).text())[1].find((day) => day.xqmc === "1").rq)
}

export default { ssoLoginForTokenURL, jxfwLogin }
