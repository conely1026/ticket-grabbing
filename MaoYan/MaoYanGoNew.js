var core = require("../core/ticket-core.js");

var CONFIG = {
    appName: "猫眼",
    consoleTitle: "猫眼 go!",
    confirmPoint: { x: 878, y: 2263 },
    isDebug: false,
    debugTicketPoint: { x: 207, y: 1170 }
};

var BUY_SELECTORS = [
    { classNameStartsWith: "android.widget.", text: "立即预订" },
    { classNameStartsWith: "android.widget.", text: "立即购票" },
    { classNameStartsWith: "android.widget.", text: "特惠购票" }
];

var PREBOOK_SELECTORS = [
    { text: "已预订" },
    { className: "android.widget.TextView", text: "已填妥" }
];

var REFRESH_SELECTORS = [
    { textContains: "刷新" }
];

var PAY_BUTTONS = [
    { className: "android.widget.Button" }
];

main();

function main() {
    core.initScript({
        appName: CONFIG.appName,
        consoleTitle: CONFIG.consoleTitle
    });

    console.log("开始猫眼抢票");
    var isPreBook = core.existsAny(PREBOOK_SELECTORS);
    console.log("是否已预填信息: " + isPreBook);
    if (!isPreBook && !CONFIG.isDebug) {
        console.log("请先填写好抢票信息；如果已经开售，请使用 MaoYanMonitor.js");
        return;
    }

    core.startRefreshThread(REFRESH_SELECTORS, {
        label: "refresh button thread started",
        clickLog: "点击刷新..."
    });

    console.log("等待开抢...");
    core.waitForAndClickAny(BUY_SELECTORS, {
        label: "等待立即购票按钮",
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
    }, PAY_BUTTONS, {
        label: "点击确认",
        intervalMs: 50,
        logEvery: 20
    });

    console.log("准备确认支付");
    if (!CONFIG.isDebug) {
        core.clickWhileAnyExists(PAY_BUTTONS, {
            label: "点击支付",
            intervalMs: 50,
            logEvery: 20
        });
    } else {
        console.log("调试模式，不点击支付按钮");
    }

    console.log("结束");
}
