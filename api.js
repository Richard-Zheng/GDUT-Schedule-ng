import encryptPassword from './crypto.js';

async function getLoginData(authURL) {
    const resp = await fetch(authURL)
    const respHTML = await resp.text()
    const pwdSalt = /<input type="hidden" id="pwdEncryptSalt" value="(\S+)" ?\/?>/.exec(respHTML)[1]
    
    return ({
        getLoginParams: (username, password) => {
            return {
                username: username,
                password: encryptPassword(password, pwdSalt),
                captcha: '',
                _eventId: 'submit',
                lt: '',
                cllt: 'userNameLogin',
                dllt: 'generalLogin',
                execution: /<input type="hidden" name="execution" value="(\S+)" ?\/?>/.exec(respHTML)[1],
            }
        },
        authHeaders: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Host': 'authserver.gdut.edu.cn',
            'Origin': 'https://authserver.gdut.edu.cn',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Mobile Safari/537.36',
            'Cookie': resp.headers.get('set-cookie'),
        },
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
                /<span id="showErrorTip"><span>(.+)<\/span><\/span>/g
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
            firstDayInSemester: await getFirstDayInSemester(jxfwHeaders, xnxqdm)
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
