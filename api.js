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

async function ssoLoginForTokenURL(username, password, authURL='https://authserver.gdut.edu.cn/authserver/login?service=http%3A%2F%2Fjxfw.gdut.edu.cn%2Fnew%2FssoLogin') {
    const data = await getLoginData(authURL)
    return (await fetch(authURL, {
        method: 'POST',
        headers: data.authHeaders,
        body: new URLSearchParams(data.getLoginParams(username, password)),
        redirect: 'manual',
    })).headers.get('Location')
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
            getCourseDateByWeek: await getCourseDateByWeekInit(jxfwHeaders, xnxqdm),
        }),
    })
}

async function getScheduleJSON(jxfwHeaders, xnxqdm) {
    return JSON.parse((await (await fetch('https://jxfw.gdut.edu.cn/xsgrkbcx!xsAllKbList.action?xnxqdm=' + xnxqdm, {
        headers: jxfwHeaders,
    })).text()).match(/var kbxx = (\[.*?\]);/)[1])
}

async function getCourseDateByWeekInit(jxfwHeaders, xnxqdm) {
    const firstWeekMonday = new Date(JSON.parse(await (await fetch('https://jxfw.gdut.edu.cn/xsgrkbcx!getKbRq.action?zc=1&xnxqdm=' + xnxqdm, {
        headers: jxfwHeaders,
    })).text())[1].find((day) => day.xqmc == "1").rq)
    return (week, dayOfTheWeek, jcArr) => {
        const jcToHourMinute = [
            [[8,30], [9,15]],
            [[9,20], [10,5]],
            [[10,25], [11,10]],
            [[11,15], [12,0]],
            [[13,50], [14,35]],
            [[14,40], [15,25]],
            [[15,30], [16,15]],
            [[16,30], [17,15]],
            [[17,20], [18,5]],
            [[18,30], [19,15]],
            [[19,20], [20,5]],
            [[20,10], [20,55]],
        ]
        const day = new Date(firstWeekMonday)
        day.setDate(day.getDate() + ((week - 1) * 7) + (dayOfTheWeek - 1))
        if (jcArr == null) {
            return day
        }
        return [
            new Date(day.setHours(jcToHourMinute[jcArr[0]-1][0][0], jcToHourMinute[jcArr[0]-1][0][1])),
            new Date(day.setHours(jcToHourMinute[jcArr[jcArr.length - 1] - 1][1][0], jcToHourMinute[jcArr[jcArr.length - 1] - 1][1][1])),
        ]
    }
}

export default { ssoLoginForTokenURL, jxfwLogin }
