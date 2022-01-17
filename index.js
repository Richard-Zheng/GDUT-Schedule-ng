import http from 'http'
import apis from './api.js'
import ICS from './ics.js'

const server = http.createServer()
server.listen(8080)
server.on('request', async (req, res) => {
    try {
        const url = new URL(req.url, `${req.protocol}://${req.headers.host}/`);
        const urlParts = url.pathname.split('_')
        const username = urlParts[1]
        const {password} = Object.fromEntries(url.searchParams);
        const xnxqdm = urlParts[2].split('.')[0]

        const jxfwTokenURL = (await apis.ssoLoginForTokenURL(username,
            password)).replace('http://', 'https://')
        const jxfwSession = await apis.jxfwLogin(jxfwTokenURL)
        const xnxqData = await jxfwSession.getXnxqData(xnxqdm)
        const cal = ICS.scheduleJsonOfSemesterToICS(xnxqData.scheduleJSON,
            await xnxqData.getFirstDayInSemester())
        res.writeHead(200, {"Content-type": "text/calendar;charset=utf-8"});
        res.end(cal.build())
    } catch (e) {
        res.writeHead(500, {"Content-type": "text/plain;charset=utf-8"})
        res.end(e.stack)
    }
})
