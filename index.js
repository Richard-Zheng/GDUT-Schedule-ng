import http from 'http'
import apis from './api.js'
import ICS from './ics.js'

const server = http.createServer()
server.listen(8080)
server.on('request', async (req, res) => {
    const url = new URL(req.url, `${req.protocol}://${req.headers.host}/`);
    const urlParts = url.pathname.split('_')
    const username = urlParts[1]
    const password = url.searchParams.get('password')
    const xnxqdm = urlParts[2].split('.')[0]

    const jxfwTokenURL = (await apis.ssoLoginForTokenURL(username, password)).replace('http://', 'https://')
    const jxfwSession = await apis.jxfwLogin(jxfwTokenURL)
    const jxfwData = await jxfwSession.getXnxqData(xnxqdm)
    const cal = new ICS()
    jxfwData.scheduleJSON.forEach((course) => {
        const schedules = weeksScheduleFormat(course.zcs.split(',').map(Number)).map((weekSchedule) => ({
            startEndTime: jxfwData.getCourseDateByWeek(weekSchedule.startWeek, course.xq, course.jcdm2.split(',').map(Number)),
            repeat: weekSchedule.times,
        }))
        schedules.forEach((schedule) => {
            cal.addEvent(course.kcmc, '', course.jxcdmcs, schedule.startEndTime[0], schedule.startEndTime[1], {
                freq: 'WEEKLY',
                count: schedule.repeat,
            })
        })
    })
    res.writeHead(200,{"Content-type":"text/calendar;charset='utf-8'"});
    res.end(cal.build())
})

function weeksScheduleFormat(weeks) {
    weeks = [...new Set(weeks)].sort((a, b) => {
        return a - b;
    });
    let output = []
    let weekStartIndex = 0
    weeks.forEach((weekNum, index) => {
        if (index == weeks.length - 1 || weeks[index + 1] != weeks[index] + 1) {
            output.push({ startWeek: weeks[weekStartIndex], times: index - weekStartIndex + 1})
            weekStartIndex = index + 1
        }
    })
    return output
}
