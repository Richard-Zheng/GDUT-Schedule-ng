import { serve } from "https://deno.land/std@0.143.0/http/server.ts";
import apis from "./api.js";
import ICS from "./ics.js";

serve(handler, { port: 8080 });
async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const urlParts = url.pathname.split("_");
    const username = urlParts[1];
    const { password } = Object.fromEntries(url.searchParams);
    const xnxqdm = urlParts[2].split(".")[0];

    const jxfwTokenURL = (await apis.ssoLoginForTokenURL(username, password))!
      .replace("http://", "https://");
    const jxfwSession = await apis.jxfwLogin(jxfwTokenURL);
    const xnxqData = await jxfwSession.getXnxqData(xnxqdm);
    const cal = ICS.scheduleJsonOfSemesterToICS(
      xnxqData.scheduleJSON,
      xnxqData.firstDayInSemester,
    );
    const calstr = cal.build()
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
