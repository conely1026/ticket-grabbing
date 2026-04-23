var core = require("../core/ticket-core.js");

var CONFIG = {
    appName: "票星球",
    consoleTitle: "票星球 go!",
    confirmPoint: { x: 878, y: 2263 },
    isDebug: false,
    debugTicketPoint: { x: 310, y: 880 }
};

var BUY_SELECTORS = [
    { desc: "立即预订" },
    { desc: "立即购票" },
    { desc: "特惠购票" },
    { desc: "立即购买" }
];

var NEXT_SELECTORS = [
    { desc: "下一步" }
];

var PAY_BUTTONS = [
    { className: "android.widget.Button", desc: "去支付" }
];

main();

function main() {
    core.initScript({
        appName: CONFIG.appName,
        consoleTitle: CONFIG.consoleTitle
    });

    console.log("开始票星球抢票");
    console.log("等待开抢，请先完成抢票准备");

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
        core.clickAnyAvailable(NEXT_SELECTORS, 20);
    }, PAY_BUTTONS, {
        label: "点击确认",
        intervalMs: 20,
        logEvery: 20
    });

    console.log("准备确认支付");
    if (!CONFIG.isDebug) {
        core.clickWhileAnyExists(PAY_BUTTONS, {
            label: "点击支付",
            intervalMs: 20,
            logEvery: 20
        });
    } else {
        console.log("调试模式，不点击支付按钮");
    }

    console.log("结束");
}
