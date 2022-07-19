import encryptPassword from './crypto.js';

async function getLoginData(authURL: string | URL | Request) {
    const resp = await fetch(authURL)
    const respHTML = await resp.text()
    
    return ({
        getLoginParams: (username: string, password: string) => {
            return {
                username: username,
                password: encryptPassword(password, /<input type="hidden" id="pwdEncryptSalt" value="(\S+)" ?\/?>/.exec(respHTML)![1]) as string,
                captcha: '',
                _eventId: 'submit',
                lt: '',
                cllt: 'userNameLogin',
                dllt: 'generalLogin',
                execution: /<input type="hidden" name="execution" value="(\S+)" ?\/?>/.exec(respHTML)![1],
            }
        },
        authHeaders: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Host': 'authserver.gdut.edu.cn',
            'Origin': 'https://authserver.gdut.edu.cn',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Mobile Safari/537.36',
            'Cookie': resp.headers.get('set-cookie')!,
        },
    })
}

async function getLoginSSOResponse(authURL: string | URL | Request, username: string | number, password: string) {
    const data = await getLoginData(authURL);
    return await fetch(authURL, {
        method: 'POST',
        headers: data.authHeaders,
        body: new URLSearchParams(data.getLoginParams(username.toString(), password)),
        redirect: 'manual',
    });
}

export async function ssoLoginForTokenURL(username: string | number, password: string, authURL='https://authserver.gdut.edu.cn/authserver/login?service=http%3A%2F%2Fjxfw.gdut.edu.cn%2Fnew%2FssoLogin') {
    const authResponse = await getLoginSSOResponse(authURL, username, password);
    if (authResponse.headers.has('Location')) {
        return authResponse.headers.get('Location');
    } else {
        const errorMessage = /<span id="showErrorTip"><span>(.+)<\/span><\/span>/g.exec(await authResponse.text())?.[1] ?? 'Login failed';
        throw new Error(errorMessage);
    }
}

export interface CourseScheduleJSON {
    /** 节次代码 example: '01,02' */
    jcdm2: string, 
    /** 教学班名称 */
    jxbmc: string,
    /** 教学场地名称 */
    jxcdmcs: string,
    /** 课程编号 */
    kcbh: string,
    /** 课程名称 */
    kcmc: string,
    /** 课程任务代码 */
    kcrwdm: string,
    /** 教师姓名 */
    teaxms: string,
    /** 星期 */
    xq: string,
    /** 周次 */
    zcs: string,
}

export async function jxfwLogin(jxfwTokenURL: string | URL | Request): Promise<HeadersInit> {
    const jxfwLoginResponse = await fetch(jxfwTokenURL, {
        redirect: 'manual',
    })
    const jxfwHeaders: HeadersInit = {
        'Cookie': jxfwLoginResponse.headers.get('Set-Cookie')!,
        'Referer': 'https://jxfw.gdut.edu.cn/',
    }
    const jxfwssoLoginResp = await fetch(jxfwLoginResponse.headers.get('Location')!.replace("http://", "https://"), {
        headers: jxfwHeaders,
        redirect: 'manual',
    })
    if (jxfwssoLoginResp.headers.get('Location') !== 'https://jxfw.gdut.edu.cn/login!welcome.action') {
        console.log('Warning: JXFW login not redirect to main page', jxfwssoLoginResp.headers.get('Location'));
    }
    return jxfwHeaders
}

/**
 * 学生个人学期课表 API
 * @param xnxqdm 学年学期代码
 */
export async function xsAllKbList(jxfwHeaders: HeadersInit, xnxqdm: string | number): Promise<CourseScheduleJSON[]> {
    const htmlPage = await (await fetch('https://jxfw.gdut.edu.cn/xsgrkbcx!xsAllKbList.action?xnxqdm=' + xnxqdm.toString(), {
        headers: jxfwHeaders,
    })).text()
    return JSON.parse(htmlPage.match(/var kbxx = (\[.*?]);/)![1])
}

/**
 * 学生按周课表 API
 * @param jxfwHeaders JXFW 登录后的 headers
 * @param zc 周次
 * @param xnxqdm 学年学期代码
 */
export async function getKbRq(jxfwHeaders: HeadersInit, zc: string | number, xnxqdm: string | number) {
    return await (await fetch(`https://jxfw.gdut.edu.cn/xsgrkbcx!getKbRq.action?zc=${zc}&xnxqdm=${xnxqdm}`, {
        headers: jxfwHeaders,
    })).json()
}

/**
 * @param jxfwHeaders JXFW 登录后的 headers
 * @param xnxqdm 学年学期代码
 * @returns 该学期的第一天
 */
export async function getFirstDayInSemester(jxfwHeaders: HeadersInit, xnxqdm: string | number) {
    const firstWeekDay = (await getKbRq(jxfwHeaders, '1', xnxqdm))[1] as Array<{xqmc: string, rq: string}>;
    return new Date(firstWeekDay.find((day) => day.xqmc === "1")!.rq)
}

export async function getXzkcList(jxfwHeaders: HeadersInit) {
    return await (await fetch("https://jxfw.gdut.edu.cn/xsxklist!getXzkcList.action", {
        "headers": jxfwHeaders,
        "body": "sort=kcrwdm&order=asc",
        "method": "POST",
    })).json();
}

export async function getAdd(jxfwHeaders: HeadersInit, kcrwdm: string | number, kcmc: string) {
    return await (await fetch("https://jxfw.gdut.edu.cn/xsxklist!getAdd.action", {
        "headers": jxfwHeaders,
        "body": `kcrwdm=${kcrwdm}&kcmc=${kcmc}`,
        "method": "POST",
    })).text()
}
