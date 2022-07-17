import { serve } from "https://deno.land/std@0.143.0/http/server.ts";
import {ssoLoginForTokenURL, jxfwLogin, xsAllKbList, getFirstDayInSemester} from "./api.ts";
import { ICSCalendar } from "./ics.ts";
import { CourseSchedule } from "./course.ts";

serve(handler, { port: 8080 });
async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const urlParts = url.pathname.split("_");
    const username = urlParts[1];
    const { password } = Object.fromEntries(url.searchParams);
    const xnxqdm = urlParts[2].split(".")[0];

    const jxfwTokenURL = (await ssoLoginForTokenURL(username, password))!
      .replace("http://", "https://");
    const jxfwSession = await jxfwLogin(jxfwTokenURL);
    const xnxqData = await xsAllKbList(jxfwSession, xnxqdm);
    const firstDayInSemester = await getFirstDayInSemester(jxfwSession, xnxqdm);
    const cal = new ICSCalendar();
    for (const course of xnxqData) {
      const courseSchedule = new CourseSchedule(course.jcdm2, course.jxbmc, course.jxcdmcs, course.kcbh, course.kcmc, course.kcrwdm, course.teaxms, Number(course.xq), course.zcs);
      const dates = courseSchedule.getCourseSchedulesInDate(firstDayInSemester);
      for (const date of dates) {
        cal.addEvent(courseSchedule.kcmc, date.start, date.end, undefined, undefined, courseSchedule.jxcdmcs, {freq: 'WEEKLY', count: date.count});
      }
    }
    console.log(xnxqData)
    const calstr = cal.toString();
    if (!calstr) {
      return new Response('Error')
    }
    return new Response(calstr, {
      headers: { "Content-type": "text/calendar;charset=utf-8" },
    });
  } catch (e) {
    return new Response(e.stack, {
      headers: { "Content-type": "text/plain;charset=utf-8" },
    });
  }
}
