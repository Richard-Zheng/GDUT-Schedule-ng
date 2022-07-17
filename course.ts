interface ZhouCi {
    /** 从第几周开始 */
    startWeek: number,
    /** 连续几周 */
    count: number,
}

interface CourseDateTime {
    /**
     * 第一节课的开始时间
     */
    start: Date,
    /**
     * 第一节课的结束时间
     */
    end: Date,
    /**
     * 每周重复，重复次数
     */
    count: number,
}

export class CourseSchedule {
    /** 节次 */
    jcArr: number[];
    /** 教学班名称 */
    jxbmc: string;
    /** 教学场地名称 */
    jxcdmcs: string;
    /** 课程编号 */
    kcbh: string;
    /** 课程名称 */
    kcmc: string;
    /** 课程任务代码 */
    kcrwdm: string;
    /** 教师姓名 */
    teaxms: string;
    /** 星期 */
    xq: number;
    /** 周次 */
    zcSchedules: ZhouCi[];

    /**
     * 从 xsgrkbcx!xsAllKbList.action API 获取的课程表
     * @param jcdm2 节次代码
     * @param jxbmc 教学班名称
     * @param jxcdmcs 教学场地名称
     * @param kcbh 课程编号
     * @param kcmc 课程名称
     * @param kcrwdm 课程任务代码
     * @param teaxms 教师姓名
     * @param xq 星期
     * @param zcs 周次
     */
    constructor(jcdm2: string, jxbmc: string, jxcdmcs: string, kcbh: string, kcmc: string, kcrwdm: string, teaxms: string, xq: number, zcs: string) {
        this.jcArr = jcdm2.split(',').map(Number);
        this.jxbmc = jxbmc;
        this.jxcdmcs = jxcdmcs;
        this.kcbh = kcbh;
        this.kcmc = kcmc;
        this.kcrwdm = kcrwdm;
        this.teaxms = teaxms;
        this.xq = xq;
        this.zcSchedules = zcsToStartWeekAndCount(zcs);
    }

    getCourseSchedulesInDate(firstDayInSemester: Date) {
        const courseSchedules: CourseDateTime[] = [];
        for (const zcSchedule of this.zcSchedules) {
            const day = new Date(firstDayInSemester)
            // 偏移至这个连续周次的第一周对应星期的那一天
            day.setDate(day.getDate() + ((zcSchedule.startWeek - 1) * 7) + (this.xq - 1))
            courseSchedules.push({
                start: new Date(day.setHours(jcToHourMinute[this.jcArr[0]-1][0][0], jcToHourMinute[this.jcArr[0]-1][0][1])),
                end: new Date(day.setHours(jcToHourMinute[this.jcArr[this.jcArr.length - 1] - 1][1][0], jcToHourMinute[this.jcArr[this.jcArr.length - 1] - 1][1][1])),
                count: zcSchedule.count,
            })
        }
        return courseSchedules;
    }
}

/**
 * 将周次字符串转换为分段连续的周次信息
 * @param zcs API 返回的周次字符串
 * @returns 整理后的周次数组
 */
function zcsToStartWeekAndCount(zcs: string) {
    const weeks = [...new Set(zcs.split(',').map(Number))].sort((a, b) => a - b);
    const output:ZhouCi[] = []
    let weekStartIndex = 0
    weeks.forEach((_weekNum, index) => {
        if (index === weeks.length - 1 || weeks[index + 1] !== weeks[index] + 1) {
            output.push({startWeek: weeks[weekStartIndex], count: index - weekStartIndex + 1})
            weekStartIndex = index + 1
        }
    })
    return output
}

/**
 * 节次转换至小时分钟
 * 参考: https://www.gdut.edu.cn/info/1900/8883.htm
 */
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