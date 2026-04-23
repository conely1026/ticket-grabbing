var core = require("../core/ticket-core.js");

var CONFIG = {
    appName: "猫眼",
    consoleTitle: "猫眼 go!",
    confirmPoint: { x: 878, y: 2263 },
    defaultSellTime: "03-19 15:00",
    defaultPlayEtc: "周六",
    defaultTicketPrice: "380"
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

var PAY_BUTTONS = [
    { className: "android.widget.Button" }
];

main();

function refreshDomWithAlert() {
    threads.start(function () {
        sleep(20);
        click(875, 1420);
    });
    alert("刷新dom!");
}

function refreshTicketDom() {
    var ticketBtnArr = [
        [215, 1030], [505, 1080], [830, 1080],
        [215, 1250], [505, 1250], [830, 1250],
        [215, 1400], [505, 1400], [830, 1400],
        [215, 1620], [505, 1620], [830, 1620]
    ];

    for (var i = 0; i < ticketBtnArr.length; i++) {
        click(ticketBtnArr[i][0], ticketBtnArr[i][1]);
        if (textContains("登记号码").exists()) {
            click(942, 997);
            console.log("成功刷新 dom");
            return;
        }
    }
    refreshDomWithAlert();
}

function main() {
    core.initScript({
        appName: CONFIG.appName,
        consoleTitle: CONFIG.consoleTitle
    });

    console.log("开始猫眼抢票");
    var isPreBook = core.existsAny(PREBOOK_SELECTORS);
    console.log("是否已预填信息: " + isPreBook);

    var playEtc = null;
    var ticketPrice = null;
    if (!isPreBook) {
        playEtc = core.promptRequired("请输入场次关键字", CONFIG.defaultPlayEtc, "请输入场次信息");
        ticketPrice = core.promptRequired("请输入票价关键字", CONFIG.defaultTicketPrice, "请输入票价信息");
        console.log("目标场次: " + playEtc);
        console.log("目标票价: " + ticketPrice);
    }

    var saleInfo = core.waitForSaleTime(CONFIG.defaultSellTime, {
        promptText: "请输入开抢时间(格式 MM-DD HH:mm)",
        emptyMessage: "请输入开抢时间",
        advanceMs: 45
    });

    console.log("开冲!");
    core.waitForAndClickAny(BUY_SELECTORS, {
        label: "等待立即购票按钮",
        intervalMs: 0,
        logEvery: 0
    });

    if (!isPreBook) {
        textContains("请选择票档").waitFor();
        if (!textContains("看台").exists()) {
            refreshTicketDom();
        }
        textContains("看台").waitFor();
        textContains(ticketPrice).findOne().click();
        console.log("已选择票档");
    }

    textContains("数量").waitFor();
    core.clickPoint(CONFIG.confirmPoint);
    console.log("已点击确认");

    className("android.widget.Button").waitFor();
    core.clickWhileAnyExists(PAY_BUTTONS, {
        label: "继续点击立即支付",
        intervalMs: 100,
        logEvery: 20
    });

    console.log("结束时间: " + core.formatTimestamp(core.fetchRemoteTimestamp()));
    console.log("起抢时间: " + core.formatTimestamp(saleInfo.realStartTimestamp));
}
