var core = require("../core/ticket-core.js");

var CONFIG = {
    appName: "纷玩岛",
    consoleTitle: "纷玩岛 go!",
    confirmPoint: { x: 878, y: 2263 },
    defaultSellTime: "04-21 16:18",
    isDebug: false,
    debugTicketPoint: { x: 700, y: 990 }
};

var BUY_SELECTORS = [
    { classNameStartsWith: "android.widget.", desc: "立即预订" },
    { classNameStartsWith: "android.widget.", desc: "立即购买" },
    { classNameStartsWith: "android.widget.", desc: "特惠购票" }
];

var SUBMIT_BUTTONS = [
    { className: "android.widget.Button", desc: "提交订单" }
];

var SUCCESS_SELECTORS = [
    { descContains: "确认并支付" },
    { textContains: "确认并支付" }
];

main();

function main() {
    core.initScript({
        appName: CONFIG.appName,
        consoleTitle: CONFIG.consoleTitle
    });

    console.log("开始抢票，请确认已预约并填好信息");
    var saleInfo = core.waitForSaleTime(CONFIG.defaultSellTime, {
        promptText: "请输入开抢时间(格式 MM-DD HH:mm)",
        emptyMessage: "请输入开抢时间",
        advanceMs: 45
    });

    console.log("开冲!");
    core.waitForAndClickAny(BUY_SELECTORS, {
        label: "等待购票按钮",
        intervalMs: 0,
        logEvery: 0
    });

    console.log("准备确认购票");
    core.clickUntilAny(function () {
        if (CONFIG.isDebug) {
            core.clickPoint(CONFIG.debugTicketPoint);
        }
        core.clickPoint(CONFIG.confirmPoint);
        core.clickAnyAvailable([{ text: "确认" }], 50);
    }, SUBMIT_BUTTONS, {
        label: "点击确认",
        intervalMs: 50,
        logEvery: 20
    });

    console.log("准备提交订单");
    if (!CONFIG.isDebug) {
        core.clickUntilAny(function () {
            core.clickAnyAvailable(SUBMIT_BUTTONS, 50);
            core.clickAnyAvailable([{ descContains: "重新选择" }, { textContains: "重新选择" }], 50);
            core.clickAnyAvailable([{ className: "android.widget.Button", desc: "确认" }], 50);
        }, SUCCESS_SELECTORS, {
            label: "提交订单",
            intervalMs: 200,
            logEvery: 20
        });
    } else {
        console.log("调试模式，不点击支付按钮");
    }

    if (core.existsAny(SUCCESS_SELECTORS)) {
        console.log("抢票成功，请尽快支付");
    }
    console.log("结束时间: " + core.formatTimestamp(core.fetchRemoteTimestamp()));
    console.log("起抢时间: " + core.formatTimestamp(saleInfo.realStartTimestamp));
}
