const state = {
      player: "新手交易员",
      day: 1,
      month: 1,
      minute: 9 * 60,
      assets: 10000,
      startDayAssets: 10000,
      level: 1,
      xp: 0,
      reputation: 50,
      difficulty: null,
      goalsCompleted: 0,
      goalIndex: 0,
      currentGoal: null,
      challengeStats: {
        trades: 0,
        calls: 0,
        events: 0,
        profitableDays: 0
      },
      manualTraining: {
        observed: 0,
        bought: false,
        sold: false,
        complete: false
      },
      upgrades: {
        desk: 0,
        analysis: 0,
        service: 0
      },
      currentCall: null,
      selected: 0,
      ai: null,
      aiShield: false,
      phonePending: false,
      marketTimer: null,
      timeTimer: null,
      eventTimer: null,
      phoneTimer: null,
      mail: [
        { title: "欢迎加入像素证券", body: "你的初始资金是 ¥10000。先从小仓位开始，别让一天的波动把你带飞。" },
        { title: "风控提示", body: "随机事件会改变公司价格。电话客户可能奖励你，也可能让你错失机会。" }
      ],
      companies: [
        { name: "方块电池", price: 28, shares: 0, trend: .18, volatility: 1.2, history: [28, 29, 28, 30, 31] },
        { name: "青柠云工厂", price: 46, shares: 0, trend: .08, volatility: 1.6, history: [46, 45, 47, 48, 46] },
        { name: "红砖机器人", price: 73, shares: 0, trend: -.06, volatility: 2.2, history: [73, 72, 74, 71, 70] }
      ]
    };

    const talks = [
      "欢迎，" + state.player + "。你现在坐在交易室里，眼前这台电脑还没打开。",
      "你选择的难度会决定市场事件、客户电话和短期目标。完成三个目标后，可以自行选择是否挑战下一难度。",
      "开局没有 AI 帮你。先打开股票终端，亲自观察三次价格变化，再完成一次买入和一次卖出。",
      "右下角会出现随机事件，电话也可能响。客户问题不止一种，回答会影响现金、声誉、经验和市场情绪。",
      "升级中心是一棵能力树：每条分支必须从第一级依次点亮，等级越高才能继续向下升级。",
      "完成手动实盘训练后，AI 商店才会解锁。购买成功和之后的盯盘提醒都会导入邮件软件。",
      "每天工作 12 小时。到 21:00 后会生成总结表，月底还会开放一家新公司。现在，点击电脑开机吧。"
    ];

    let talkIndex = 0;

    const difficultyDefs = [
      {
        name: "新手盘",
        subtitle: "温和波动与基础咨询",
        volatility: .78,
        phoneChance: .5,
        eventInterval: 11000,
        phoneInterval: 14500,
        events: [
          { title: "新品测评", text: "方块电池新品获得媒体好评，订单预期小幅上升。", target: "方块电池", trend: .24, shock: 1.8 },
          { title: "园区补贴", text: "青柠云工厂获得园区电费补助，成本压力下降。", target: "青柠云工厂", trend: .18, shock: 1.4 },
          { title: "交付延期", text: "红砖机器人一批设备延期交付，市场情绪转弱。", target: "红砖机器人", trend: -.2, shock: -1.6 },
          { title: "消费回暖", text: "市场交易情绪回暖，三家公司获得小幅买盘。", all: true, trend: .06, shock: .7 },
          { title: "午间传闻", text: "未经证实的论坛消息扰动股价，波动很快平息。", all: true, trend: -.03, shock: -.5 }
        ],
        goals: [
          cycle => ({ type: "trades", title: "熟悉买卖", target: 3 + cycle * 2, reward: 420 + cycle * 120 }),
          cycle => ({ type: "calls", title: "完成客户咨询", target: 2 + cycle, reward: 520 + cycle * 140 }),
          cycle => ({ type: "assets", title: "提升总资产", target: 10800 + cycle * 1800, reward: 650 + cycle * 180 }),
          cycle => ({ type: "reputation", title: "建立客户口碑", target: Math.min(90, 58 + cycle * 6), reward: 720 + cycle * 200 }),
          cycle => ({ type: "profitableDays", title: "取得盈利日", target: 1 + cycle, reward: 800 + cycle * 220 })
        ]
      },
      {
        name: "专业盘",
        subtitle: "财报驱动与组合压力",
        volatility: 1.12,
        phoneChance: .66,
        eventInterval: 8000,
        phoneInterval: 11000,
        events: [
          { title: "审计问询", text: "青柠云工厂收到收入确认问询，机构开始下调估值。", target: "青柠云工厂", trend: -.42, shock: -3.8 },
          { title: "股东减持", text: "方块电池重要股东披露减持计划，短线抛压增加。", target: "方块电池", trend: -.36, shock: -3.1 },
          { title: "上调指引", text: "红砖机器人上调季度交付指引，资金快速流入。", target: "红砖机器人", trend: .46, shock: 4.2 },
          { title: "行业轮动", text: "资金从高估值板块转向制造业，个股走势开始分化。", target: "红砖机器人", trend: .3, shock: 2.7 },
          { title: "利率上行", text: "融资成本预期上升，成长股估值集体承压。", all: true, trend: -.16, shock: -2.2 }
        ],
        goals: [
          cycle => ({ type: "trades", title: "执行组合交易", target: 6 + cycle * 3, reward: 900 + cycle * 220 }),
          cycle => ({ type: "events", title: "应对市场事件", target: 3 + cycle, reward: 1050 + cycle * 260 }),
          cycle => ({ type: "calls", title: "处理专业咨询", target: 3 + cycle, reward: 1150 + cycle * 300 }),
          cycle => ({ type: "assets", title: "扩大管理资产", target: 13500 + cycle * 3000, reward: 1350 + cycle * 340 }),
          cycle => ({ type: "profitableDays", title: "保持连续盈利", target: 2 + cycle, reward: 1500 + cycle * 380 })
        ]
      },
      {
        name: "风暴盘",
        subtitle: "黑天鹅与极端流动性",
        volatility: 1.62,
        phoneChance: .82,
        eventInterval: 5700,
        phoneInterval: 8200,
        events: [
          { title: "闪电崩盘", text: "量化卖单瞬间击穿盘口，所有股票出现流动性真空。", all: true, trend: -.34, shock: -6.4 },
          { title: "核心禁运", text: "关键零部件遭遇临时禁运，红砖机器人生产计划中断。", target: "红砖机器人", trend: -.68, shock: -8.1 },
          { title: "数据泄露", text: "青柠云工厂披露客户数据泄露，监管调查立即启动。", target: "青柠云工厂", trend: -.72, shock: -8.8 },
          { title: "逼空行情", text: "方块电池空头集中回补，价格在低流动性中急升。", target: "方块电池", trend: .78, shock: 9.2 },
          { title: "交易冻结", text: "市场传出清算机构故障，恐慌与抢筹同时出现。", all: true, trend: .08, shock: -4.7 }
        ],
        goals: [
          cycle => ({ type: "events", title: "穿越极端事件", target: 4 + cycle * 2, reward: 1800 + cycle * 420 }),
          cycle => ({ type: "calls", title: "稳定高压客户", target: 4 + cycle, reward: 2050 + cycle * 480 }),
          cycle => ({ type: "trades", title: "完成风暴交易", target: 8 + cycle * 4, reward: 2300 + cycle * 520 }),
          cycle => ({ type: "reputation", title: "守住机构信誉", target: Math.min(95, 72 + cycle * 5), reward: 2550 + cycle * 560 }),
          cycle => ({ type: "profitableDays", title: "风暴中实现盈利", target: 2 + cycle, reward: 2800 + cycle * 620 })
        ]
      }
    ];

    const upgradeDefs = {
      desk: {
        name: "交易席位",
        desc: ["手续费-5%", "手续费-12%", "手续费-22%"],
        costs: [1600, 5200, 11800]
      },
      analysis: {
        name: "研究能力",
        desc: ["事件影响更清楚", "价格波动略可控", "每日开盘给趋势提示"],
        costs: [2200, 6800, 15000]
      },
      service: {
        name: "客户服务",
        desc: ["电话经验+20%", "声誉奖励+30%", "坏回答损失降低"],
        costs: [1800, 5600, 13200]
      }
    };

    const $ = (id) => document.getElementById(id);
    const introScreen = $("introScreen");
    const gameScreen = $("gameScreen");
    const dialogue = $("dialogue");
    const monitor = $("monitor");
    const chart = $("chart");
    const ctx = chart.getContext("2d");

    function money(value) {
      return "¥" + Math.round(value).toLocaleString("zh-CN");
    }

    function portfolioValue() {
      return state.companies.reduce((sum, c) => sum + c.price * c.shares, state.assets);
    }

    function difficultyDef() {
      return difficultyDefs[state.difficulty === null ? 0 : state.difficulty];
    }

    function goalValue(goal) {
      if (!goal) return 0;
      if (goal.type === "assets") return Math.round(portfolioValue());
      if (goal.type === "reputation") return state.reputation;
      return Math.max(0, (state.challengeStats[goal.type] || 0) - (goal.startValue || 0));
    }

    function goalUnit(goal) {
      if (!goal) return "";
      if (goal.type === "assets") return "资产";
      if (goal.type === "reputation") return "声誉";
      if (goal.type === "trades") return "次交易";
      if (goal.type === "calls") return "通电话";
      if (goal.type === "events") return "个事件";
      return "个盈利日";
    }

    function goalProgressText(goal) {
      if (!goal) return "选择难度后生成短期目标";
      const current = Math.min(goalValue(goal), goal.target);
      if (goal.type === "assets") return money(current) + " / " + money(goal.target);
      return current + " / " + goal.target + " " + goalUnit(goal);
    }

    function createNextGoal() {
      const def = difficultyDef();
      const templateIndex = state.goalIndex % def.goals.length;
      const cycle = Math.floor(state.goalIndex / def.goals.length);
      const goal = def.goals[templateIndex](cycle);
      goal.startValue = goal.type === "assets" || goal.type === "reputation" ? 0 : (state.challengeStats[goal.type] || 0);
      if (goal.type === "assets") {
        const requiredGain = [700, 1400, 2200][state.difficulty] + cycle * 500;
        goal.target = Math.max(goal.target, Math.round(portfolioValue() + requiredGain));
      }
      if (goal.type === "reputation") {
        const requiredRep = [4, 6, 8][state.difficulty];
        goal.target = Math.min(100, Math.max(goal.target, state.reputation + requiredRep));
      }
      state.currentGoal = goal;
      state.goalIndex += 1;
      renderChallenge();
    }

    function renderChallenge() {
      const def = state.difficulty === null ? null : difficultyDef();
      $("difficultyText").textContent = def ? def.name : "尚未选择难度";
      $("goalCountText").textContent = "已完成 " + state.goalsCompleted;
      $("goalTitleText").textContent = state.currentGoal ? state.currentGoal.title : "等待开局";
      $("goalProgressText").textContent = goalProgressText(state.currentGoal);
      const canAdvance = state.difficulty !== null && state.difficulty < difficultyDefs.length - 1 && state.goalsCompleted >= 3;
      $("nextDifficultyBtn").hidden = !canAdvance;
      if (canAdvance) $("nextDifficultyBtn").textContent = "挑战 " + difficultyDefs[state.difficulty + 1].name;
    }

    function checkGoalProgress() {
      let goal = state.currentGoal;
      if (!goal) return;
      let completedNow = 0;
      while (goal && goalValue(goal) >= goal.target && completedNow < 8) {
        const reward = goal.reward;
        state.assets += reward;
        state.goalsCompleted += 1;
        addXp(45 + state.difficulty * 25);
        addMail(
          "短期目标完成：" + goal.title,
          "获得 " + money(reward) + " 目标奖金。当前难度已完成 " + state.goalsCompleted + " 个目标。"
        );
        setStatus("目标完成：" + goal.title + "，奖励 " + money(reward) + "。新目标已生成。");
        createNextGoal();
        completedNow += 1;
        goal = state.currentGoal;
      }
      renderChallenge();
      updateHud();
    }

    function selectDifficulty(index, advancing) {
      const next = difficultyDefs[index];
      state.difficulty = index;
      state.goalsCompleted = 0;
      state.goalIndex = 0;
      state.currentGoal = null;
      state.challengeStats = { trades: 0, calls: 0, events: 0, profitableDays: 0 };
      createNextGoal();
      closeModal("difficultyModal");
      closeModal("advanceModal");
      addMail("难度已设定：" + next.name, next.subtitle + "。事件、电话和短期目标已切换到这一难度。");
      if (advancing) {
        setStatus("已进入 " + next.name + "。新的目标链开始了。");
        startTimers();
        return;
      }
      introScreen.classList.remove("active");
      gameScreen.classList.add("active");
      renderCompanies();
      renderUpgrades();
      renderManualTraining();
      renderAiStore();
      drawChart();
      updateHud();
      talkIndex = 0;
      showDialogue();
    }

    function updateHud() {
      $("assetText").textContent = money(portfolioValue());
      $("levelText").textContent = state.level;
      $("xpText").textContent = state.xp + "/" + xpNeed();
      $("repText").textContent = state.reputation;
      $("dayText").textContent = state.day;
      $("monthText").textContent = state.month;
      $("timeText").textContent = String(Math.floor(state.minute / 60)).padStart(2, "0") + ":" + String(state.minute % 60).padStart(2, "0");
      $("mailCount").textContent = state.mail.length;
      $("aiText").textContent = "AI盯盘：" + (state.ai ? state.ai.name : "未安装");
      renderChallenge();
    }

    function addMail(title, body) {
      state.mail.unshift({ title, body });
      renderPcMail();
      updateHud();
    }

    function openComputerApp(appId) {
      document.querySelectorAll(".app-window").forEach(app => app.classList.remove("active"));
      $(appId).classList.add("active");
      if (appId === "mailApp") renderPcMail();
      if (appId === "upgradeApp") renderUpgrades();
      if (appId === "aiStoreApp") renderAiStore();
      if (appId === "marketApp") {
        renderCompanies();
        drawChart();
      }
    }

    function renderPcMail() {
      const list = $("pcMailList");
      if (!list) return;
      list.innerHTML = state.mail.map(mail => '<div class="pc-mail-item"><strong>' + mail.title + '</strong><br>' + mail.body + '</div>').join("");
    }

    function xpNeed() {
      return 120 + (state.level - 1) * 80;
    }

    function addXp(amount) {
      const bonus = 1 + state.upgrades.service * .2;
      state.xp += Math.max(1, Math.round(amount * bonus));
      while (state.xp >= xpNeed()) {
        state.xp -= xpNeed();
        state.level += 1;
        state.assets += 350 + state.level * 120;
        addMail(
          "等级提升：LV." + state.level,
          "你的交易员等级提升，获得成长奖金 " + money(350 + state.level * 120) + "。更高等级可以购买更强升级。"
        );
        toast("升级到 LV." + state.level + "，获得成长奖金。");
      }
      updateHud();
    }

    function tradeFee(price) {
      const rate = Math.max(.01, .04 - state.upgrades.desk * .007);
      return Math.max(1, Math.round(price * rate));
    }

    function clampReputation(value) {
      state.reputation = Math.max(0, Math.min(100, Math.round(value)));
    }

    function renderManualTraining() {
      const task = $("manualTask");
      if (!task) return;
      if (state.manualTraining.complete) {
        task.textContent = "新手实盘训练完成：AI 商店已解锁";
        task.style.color = "var(--green)";
      } else {
        task.textContent = "新手实盘训练：观察行情 " + state.manualTraining.observed + "/3 · 买入 " + (state.manualTraining.bought ? "1" : "0") + "/1 · 卖出 " + (state.manualTraining.sold ? "1" : "0") + "/1";
      }
    }

    function checkManualTraining() {
      const training = state.manualTraining;
      if (!training.complete && training.observed >= 3 && training.bought && training.sold) {
        training.complete = true;
        addXp(60);
        addMail("新手实盘训练完成", "你已经亲自观察行情并完成买入、卖出。AI 商店现已解锁，但交易决策仍由你负责。");
        setStatus("实盘训练完成，AI 商店已解锁。");
      }
      renderManualTraining();
      renderAiStore();
    }

    function renderAiStore() {
      const unlocked = state.manualTraining.complete;
      const notice = $("aiStoreNotice");
      if (notice) {
        notice.textContent = unlocked
          ? "商店已解锁。购买完成与盯盘提醒会自动导入邮件。"
          : "商店锁定：请先在股票终端完成观察、买入和卖出训练。";
      }
      document.querySelectorAll("[data-ai]").forEach(btn => {
        btn.disabled = !unlocked;
        btn.title = unlocked ? "" : "完成新手实盘训练后解锁";
      });
    }

    function renderUpgrades() {
      const tree = $("upgradeList");
      tree.innerHTML = '<div class="tree-root">交易员主干<br>当前 LV.' + state.level + '</div><div class="tree-branches"></div>';
      const branches = tree.querySelector(".tree-branches");
      Object.entries(upgradeDefs).forEach(([key, def]) => {
        const current = state.upgrades[key];
        const branch = document.createElement("div");
        branch.className = "tree-branch";
        branch.innerHTML = '<div class="tree-branch-title">' + def.name + ' · ' + current + '/3</div>';
        def.desc.forEach((desc, index) => {
          const stage = index + 1;
          const completed = current >= stage;
          const available = current === index && state.level >= stage;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "upgrade-node " + (completed ? "completed" : available ? "available" : "locked");
          btn.innerHTML = "LV." + stage + " " + desc + "<br>" + (completed ? "[ 已点亮 ]" : money(def.costs[index]) + " · 需要交易员 LV." + stage);
          btn.disabled = completed || !available;
          btn.title = completed ? "已点亮" : current < index ? "请先点亮上一级" : state.level < stage ? "交易员等级不足" : "购买升级";
          if (available) btn.addEventListener("click", () => buyUpgrade(key));
          branch.appendChild(btn);
        });
        branches.appendChild(branch);
      });
    }

    function buyUpgrade(key) {
      const def = upgradeDefs[key];
      const current = state.upgrades[key];
      if (current >= 3) {
        setStatus(def.name + " 已满级。");
        return;
      }
      if (state.level < current + 1) {
        setStatus("等级不足，需要 LV." + (current + 1) + " 才能升级 " + def.name + "。");
        return;
      }
      const cost = def.costs[current];
      if (state.assets < cost) {
        setStatus("资产不足，无法升级 " + def.name + "。");
        return;
      }
      state.assets -= cost;
      state.upgrades[key] += 1;
      addXp(25);
      setStatus(def.name + " 升到 LV." + state.upgrades[key] + "：" + def.desc[current]);
      renderUpgrades();
      updateHud();
    }

    function renderCompanies() {
      $("companyList").innerHTML = "";
      state.companies.forEach((company, index) => {
        const btn = document.createElement("button");
        btn.className = "company" + (index === state.selected ? " selected" : "");
        const change = company.history.length > 1 ? company.price - company.history[company.history.length - 2] : 0;
        btn.innerHTML = company.name + "<br>" + money(company.price) + " / 持仓 " + company.shares + " / " + (change >= 0 ? "+" : "") + change.toFixed(1);
        btn.addEventListener("click", () => {
          state.selected = index;
          renderCompanies();
          drawChart();
        });
        $("companyList").appendChild(btn);
      });
      $("selectedName").textContent = state.companies[state.selected].name;
    }

    function drawChart() {
      const company = state.companies[state.selected];
      const w = chart.width;
      const h = chart.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#07101d";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#263455";
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const data = company.history.slice(-26);
      const min = Math.min(...data) - 3;
      const max = Math.max(...data) + 3;
      ctx.strokeStyle = data[data.length - 1] >= data[0] ? "#76f07d" : "#ff6b6b";
      ctx.lineWidth = 5;
      ctx.beginPath();
      data.forEach((price, i) => {
        const x = 12 + i * ((w - 24) / Math.max(1, data.length - 1));
        const y = h - 12 - ((price - min) / Math.max(1, max - min)) * (h - 24);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "#f6f0d8";
      ctx.font = "16px Courier New";
      ctx.fillText(company.name + " " + money(company.price), 12, 24);
    }

    function setStatus(text) {
      $("statusLine").textContent = text;
      toast(text);
    }

    function toast(text) {
      const item = document.createElement("div");
      item.className = "toast";
      item.textContent = text;
      $("noticeLog").prepend(item);
      setTimeout(() => item.remove(), 4200);
    }

    function tickMarket() {
      state.companies.forEach((company) => {
        const control = Math.max(.72, 1 - state.upgrades.analysis * .07);
        const random = (Math.random() - .5) * company.volatility * control * difficultyDef().volatility;
        const aiBoost = state.ai && Math.random() < state.ai.edge ? .18 : 0;
        const next = Math.max(3, company.price + company.trend + random + aiBoost);
        company.price = Math.round(next * 10) / 10;
        company.history.push(company.price);
        if (company.history.length > 36) company.history.shift();
      });
      if (state.ai && Math.random() < state.ai.tipRate) {
        const best = state.companies.reduce((a, b) => a.trend > b.trend ? a : b);
        addMail("AI盯盘：" + best.name, best.name + " 动能更强，建议打开股票终端观察价格和持仓。");
        setStatus("AI盯盘软件发来一封新邮件。");
      }
      if (!state.manualTraining.complete && $("marketApp").classList.contains("active")) {
        state.manualTraining.observed = Math.min(3, state.manualTraining.observed + 1);
        checkManualTraining();
      }
      renderCompanies();
      drawChart();
      updateHud();
    }

    function tickTime() {
      state.minute += 15;
      if (state.minute >= 21 * 60) {
        endDay();
      }
      updateHud();
    }

    function startTimers() {
      clearTimers();
      const def = difficultyDef();
      state.marketTimer = setInterval(tickMarket, 1400);
      state.timeTimer = setInterval(tickTime, 2500);
      state.eventTimer = setInterval(randomEvent, def.eventInterval);
      state.phoneTimer = setInterval(randomPhone, def.phoneInterval);
    }

    function clearTimers() {
      clearInterval(state.marketTimer);
      clearInterval(state.timeTimer);
      clearInterval(state.eventTimer);
      clearInterval(state.phoneTimer);
    }

    function openModal(id) {
      $(id).classList.add("open");
    }

    function closeModal(id) {
      $(id).classList.remove("open");
    }

    function showDialogue() {
      dialogue.classList.add("open");
      $("dialogueText").textContent = talks[talkIndex].replace("新手交易员", state.player);
      $("nextTalk").textContent = talkIndex === talks.length - 1 ? "知道了" : "继续";
    }

    function randomEvent() {
      const events = difficultyDef().events;
      const ev = events[Math.floor(Math.random() * events.length)];
      applyEvent(ev);
      state.challengeStats.events += 1;
      $("eventTitle").textContent = ev.title;
      $("eventText").textContent = ev.text;
      $("eventCard").classList.add("open");
      if (state.ai && state.ai.level >= 2) {
        addMail("AI事件解析：" + ev.title, ev.text + " 标准版以上会把事件解析导入邮件，方便你回看。");
        setStatus("AI事件解析已导入邮件。");
      }
      checkGoalProgress();
    }

    function applyEvent(ev) {
      state.companies.forEach((company) => {
        if (ev.all || company.name === ev.target) {
          const researchBuffer = ev.shock < 0 ? 1 - state.upgrades.analysis * .08 : 1;
          company.trend += ev.trend;
          company.price = Math.max(3, Math.round((company.price + ev.shock * researchBuffer) * 10) / 10);
          company.history.push(company.price);
        }
      });
      renderCompanies();
      drawChart();
      updateHud();
    }

    function randomPhone() {
      if (state.phonePending || Math.random() > difficultyDef().phoneChance) return;
      state.phonePending = true;
      $("phone").classList.add("ringing");
      setStatus("电话响了：客户正在等你接听。");
    }

    function buildPhoneCall() {
      const selected = state.companies[state.selected];
      const worst = state.companies.reduce((a, b) => a.trend < b.trend ? a : b);
      const best = state.companies.reduce((a, b) => a.trend > b.trend ? a : b);
      const beginnerCalls = [
        {
          text: "新客户：我刚看到 " + selected.name + " 上涨，现在一次买完还是分批买？",
          choices: [
            { label: "分三次建立仓位", cash: 190, xp: 28, rep: 5, target: selected.name, trend: .05, status: "客户学会了分批建仓，支付了基础咨询费。" },
            { label: "现在全部买入", cash: 260, xp: 16, rep: -4, target: selected.name, trend: .2, status: "客户冲动追涨，短线热度增加，但信任下降。" },
            { label: "什么都别买", cash: -140, xp: 10, rep: -2, status: "建议过于绝对，客户结束了咨询。" }
          ]
        },
        {
          text: "退休客户：" + worst.name + " 跌了，我睡不着。现在应该怎么处理？",
          choices: [
            { label: "核对风险承受能力", cash: 250, xp: 34, rep: 6, target: worst.name, trend: .02, status: "你先了解客户情况，再制定减仓方案。" },
            { label: "立刻全部卖掉", cash: 80, xp: 16, rep: -3, target: worst.name, trend: -.14, status: "客户恐慌卖出，市场承压。" },
            { label: "保证明天会涨", cash: -360, xp: 8, rep: -7, status: "你做了无法兑现的保证，客户非常不满。" }
          ]
        },
        {
          text: "学生客户：我的钱不多，AI软件和股票应该先买哪个？",
          choices: [
            { label: "先保留现金再小仓尝试", cash: 220, xp: 32, rep: 7, status: "客户接受了量力而行的方案。" },
            { label: "优先买最贵AI", cash: 420, xp: 16, rep: -6, status: "你赚了佣金，但客户资金压力很大。" },
            { label: "借钱扩大本金", cash: -480, xp: 10, rep: -9, status: "高风险建议引发投诉。" }
          ]
        }
      ];
      const professionalCalls = [
        {
          text: "机构客户：" + best.name + " 即将发布财报，组合权重是否要提前上调？",
          choices: [
            { label: "用情景分析分步调整", cash: 620, xp: 46, rep: 7, target: best.name, trend: .1, status: "你的情景分析获得机构认可。" },
            { label: "财报前直接翻倍", cash: 880, xp: 24, rep: -6, target: best.name, trend: .34, status: "组合风险骤升，机构要求追加说明。" },
            { label: "完全回避财报股", cash: -420, xp: 18, rep: -3, status: "你没有提供可执行的组合方案。" }
          ]
        },
        {
          text: "基金经理：成长股同步下跌，要卖 " + worst.name + " 还是先做组合再平衡？",
          choices: [
            { label: "按相关性重新配权", cash: 760, xp: 52, rep: 8, all: true, trend: .04, status: "再平衡方案降低了组合集中度。" },
            { label: "只砍跌幅最大的", cash: 300, xp: 25, rep: -4, target: worst.name, trend: -.22, status: "机械止损造成额外冲击。" },
            { label: "保持原仓位不复盘", cash: -560, xp: 14, rep: -6, status: "客户认为你忽视了组合风险。" }
          ]
        },
        {
          text: "企业财务：我们两天后要用现金，持有的股票如何处理流动性？",
          choices: [
            { label: "分时段降低风险敞口", cash: 680, xp: 48, rep: 7, all: true, trend: -.03, status: "现金计划与成交冲击得到平衡。" },
            { label: "等最后一天一次卖完", cash: 140, xp: 20, rep: -5, all: true, trend: -.12, status: "流动性风险被拖到最后。" },
            { label: "建议继续加仓", cash: -720, xp: 15, rep: -8, status: "建议与客户现金需求完全冲突。" }
          ]
        }
      ];
      const stormCalls = [
        {
          text: "高杠杆客户：账户触发追加保证金，" + worst.name + " 还在跳水，我必须马上做决定！",
          choices: [
            { label: "先降杠杆保住流动性", cash: 1100, xp: 62, rep: 9, target: worst.name, trend: -.08, status: "你优先控制穿仓风险，客户账户暂时稳定。" },
            { label: "加倍押注等待反弹", cash: 1700, xp: 30, rep: -12, target: worst.name, trend: -.38, status: "高风险押注放大了市场恐慌。" },
            { label: "挂断电话", cash: -1400, xp: 10, rep: -15, status: "客户在最危险的时刻失去支持。" }
          ]
        },
        {
          text: "家族办公室：市场传出清算故障，组合可能无法成交，如何安排优先级？",
          choices: [
            { label: "先保护现金和核心仓位", cash: 1350, xp: 68, rep: 10, all: true, trend: .03, status: "你的危机清单帮助客户稳住了核心资产。" },
            { label: "追逐正在逼空的股票", cash: 2100, xp: 34, rep: -13, target: best.name, trend: .48, status: "客户追入极端行情，风险迅速累积。" },
            { label: "宣布所有市场都不可信", cash: -1250, xp: 14, rep: -11, all: true, trend: -.2, status: "失控言论进一步放大恐慌。" }
          ]
        },
        {
          text: "愤怒客户：你昨天推荐的 " + selected.name + " 暴跌，我要求立即赔偿并退出！",
          choices: [
            { label: "展示记录并给出止损方案", cash: 980, xp: 64, rep: 8, target: selected.name, trend: -.04, status: "透明复盘缓和了投诉。" },
            { label: "把责任推给突发新闻", cash: 520, xp: 26, rep: -10, status: "客户认为你在逃避责任。" },
            { label: "承诺下一笔一定赚回", cash: -1800, xp: 18, rep: -16, target: selected.name, trend: .42, status: "危险承诺让投诉进一步升级。" }
          ]
        }
      ];
      const calls = [beginnerCalls, professionalCalls, stormCalls][state.difficulty];
      return calls[Math.floor(Math.random() * calls.length)];
    }

    function answerPhone(choice) {
      state.phonePending = false;
      $("phone").classList.remove("ringing");
      closeModal("phoneModal");
      const serviceBoost = 1 + state.upgrades.service * .1;
      const lossBuffer = choice.cash < 0 ? Math.max(.55, 1 - state.upgrades.service * .13) : 1;
      const cashDelta = Math.round(choice.cash * serviceBoost * lossBuffer);
      state.assets += cashDelta;
      clampReputation(state.reputation + Math.round(choice.rep * (choice.rep > 0 ? 1 + state.upgrades.service * .15 : 1)));
      addXp(choice.xp);
      state.companies.forEach((company) => {
        if (choice.all || company.name === choice.target) {
          company.trend += choice.trend || 0;
        }
      });
      const cashText = cashDelta >= 0 ? "+" + money(cashDelta) : "-" + money(Math.abs(cashDelta));
      setStatus(choice.status + " 现金" + cashText + "，声誉 " + state.reputation + "。");
      state.challengeStats.calls += 1;
      state.currentCall = null;
      checkGoalProgress();
      updateHud();
    }

    function endDay() {
      clearTimers();
      const endAssets = portfolioValue();
      const profit = endAssets - state.startDayAssets;
      if (profit > 0) state.challengeStats.profitableDays += 1;
      checkGoalProgress();
      const finalAssets = portfolioValue();
      const holdings = state.companies.filter(c => c.shares > 0).map(c => c.name + " " + c.shares + "手").join("，") || "无持仓";
      $("summaryGrid").innerHTML = [
        ["今日收益", money(profit)],
        ["总资产", money(finalAssets)],
        ["持仓", holdings],
        ["等级/声誉", "LV." + state.level + " / " + state.reputation],
        ["AI软件", state.ai ? state.ai.name : "未安装"],
        ["难度/目标", difficultyDef().name + " / 已完成" + state.goalsCompleted]
      ].map(([k, v]) => '<div class="summary-item"><span>' + k + '</span><strong>' + v + '</strong></div>').join("");
      $("summaryComment").textContent = profit >= 0 ? "今天收盘表现不错，别让盈利冲昏头，明天继续看事件和电话。" : "今天亏损了，复盘仓位和事件反应，明天还有机会。";
      openModal("summaryModal");
    }

    function newDay() {
      closeModal("summaryModal");
      state.assets = portfolioValue() - state.companies.reduce((sum, c) => sum + c.price * c.shares, 0);
      state.day += 1;
      state.minute = 9 * 60;
      state.startDayAssets = portfolioValue();
      if ((state.day - 1) % 30 === 0) {
        state.month += 1;
        const pool = ["星港物流", "蓝鲸芯片", "薄荷医药", "雷火游戏", "铜钥支付"];
        const name = pool[(state.month - 2) % pool.length];
        state.companies.push({
          name,
          price: 30 + Math.round(Math.random() * 60),
          shares: 0,
          trend: (Math.random() - .35) * .4,
          volatility: 1.2 + Math.random() * 1.5,
          history: [30, 31, 32, 31, 33].map(v => v + Math.round(Math.random() * 20))
        });
        addMail("新公司上市：" + name, name + " 已加入你的可投资列表。月底扩容会让市场更复杂。");
        toast("新月份开启：" + name + " 上市。");
      }
      if (state.upgrades.analysis >= 3) {
        const best = state.companies.reduce((a, b) => a.trend > b.trend ? a : b);
        addMail("研究部晨报", "今日趋势最强观察对象：" + best.name + "。这不是保证盈利，但值得盯盘。");
      }
      renderCompanies();
      renderUpgrades();
      drawChart();
      updateHud();
      startTimers();
    }

    function buyShare() {
      const company = state.companies[state.selected];
      const fee = tradeFee(company.price);
      if (state.assets < company.price + fee) {
        setStatus("现金不够，无法买入 " + company.name + "。");
        return;
      }
      state.assets -= company.price + fee;
      company.shares += 1;
      state.challengeStats.trades += 1;
      state.manualTraining.bought = true;
      addXp(8);
      setStatus("买入 " + company.name + " 1手，手续费 " + money(fee) + "。");
      renderCompanies();
      checkManualTraining();
      checkGoalProgress();
      updateHud();
    }

    function sellShare() {
      const company = state.companies[state.selected];
      if (company.shares <= 0) {
        setStatus("没有 " + company.name + " 持仓，无法卖出。");
        return;
      }
      company.shares -= 1;
      const fee = tradeFee(company.price);
      state.assets += company.price - fee;
      state.challengeStats.trades += 1;
      state.manualTraining.sold = true;
      addXp(8);
      setStatus("卖出 " + company.name + " 1手，手续费 " + money(fee) + "。");
      renderCompanies();
      checkManualTraining();
      checkGoalProgress();
      updateHud();
    }

    function buyAi(type) {
      const options = {
        cheap: { name: "便宜版", cost: 1800, tipRate: .16, edge: .02, level: 1 },
        mid: { name: "标准版", cost: 5600, tipRate: .32, edge: .05, level: 2 },
        pro: { name: "旗舰版", cost: 12800, tipRate: .52, edge: .08, level: 3 }
      };
      const option = options[type];
      if (!state.manualTraining.complete) {
        setStatus("先完成股票终端里的手动盯盘、买入和卖出训练。");
        return;
      }
      if (state.ai && state.ai.level >= option.level) {
        setStatus("你已经拥有同级或更高级 AI。");
        return;
      }
      if (state.assets < option.cost) {
        setStatus("资产不足，买不起 " + option.name + "。");
        return;
      }
      state.assets -= option.cost;
      state.ai = option;
      state.aiShield = option.level >= 3;
      addXp(18 * option.level);
      addMail("AI盯盘软件安装完成", option.name + " 已购买并安装。之后盯盘软件会把重要提示导入邮件应用。");
      openComputerApp("mailApp");
      setStatus("已安装 AI盯盘 " + option.name + "。");
      updateHud();
    }

    function renderMail() {
      $("mailList").innerHTML = state.mail.map(mail => '<div class="mail-item"><strong>' + mail.title + '</strong><br>' + mail.body + '</div>').join("");
      renderPcMail();
    }

    $("startBtn").addEventListener("click", () => openModal("difficultyModal"));

    document.querySelectorAll("[data-difficulty]").forEach(btn => {
      btn.addEventListener("click", () => selectDifficulty(Number(btn.dataset.difficulty), false));
    });

    $("howBtn").addEventListener("click", () => openModal("howModal"));
    $("loginOpen").addEventListener("click", () => openModal("loginModal"));
    $("loginSave").addEventListener("click", () => {
      state.player = $("playerName").value.trim() || "新手交易员";
      talks[0] = "欢迎，" + state.player + "。你现在坐在交易室里，眼前这台电脑还没打开。";
      closeModal("loginModal");
    });

    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });

    $("nextTalk").addEventListener("click", () => {
      talkIndex += 1;
      if (talkIndex >= talks.length) {
        dialogue.classList.remove("open");
        $("advisor").classList.add("hidden");
      } else {
        showDialogue();
      }
    });

    monitor.addEventListener("click", () => {
      if (monitor.classList.contains("on")) return;
      monitor.classList.remove("off");
      monitor.classList.add("on");
      openComputerApp("marketApp");
      setStatus("电脑已开机。先观察三次行情，再亲自买入和卖出一次。");
      startTimers();
    });

    document.querySelectorAll("[data-app]").forEach(btn => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        openComputerApp(btn.dataset.app);
      });
    });

    $("buyBtn").addEventListener("click", buyShare);
    $("sellBtn").addEventListener("click", sellShare);
    document.querySelectorAll("[data-ai]").forEach(btn => btn.addEventListener("click", () => buyAi(btn.dataset.ai)));
    $("eventOk").addEventListener("click", () => $("eventCard").classList.remove("open"));
    $("endDayBtn").addEventListener("click", endDay);
    $("newDayBtn").addEventListener("click", newDay);
    $("nextDifficultyBtn").addEventListener("click", () => {
      if (state.difficulty === null || state.difficulty >= difficultyDefs.length - 1 || state.goalsCompleted < 3) return;
      clearTimers();
      const current = difficultyDef();
      const next = difficultyDefs[state.difficulty + 1];
      $("advanceText").innerHTML = "你已在 <strong>" + current.name + "</strong> 完成 " + state.goalsCompleted + " 个目标。<br>下一档是 <strong>" + next.name + "</strong>：" + next.subtitle + "。<br><br>升阶后将更换事件、电话和目标链；资产、持仓、升级与 AI 都会保留。";
      openModal("advanceModal");
    });
    $("advanceConfirmBtn").addEventListener("click", () => selectDifficulty(state.difficulty + 1, true));
    $("advanceCancelBtn").addEventListener("click", startTimers);
    $("mailBtn").addEventListener("click", () => {
      renderMail();
      openModal("mailModal");
    });
    $("phoneBtn").addEventListener("click", () => {
      if (!state.phonePending) {
        setStatus("电话暂时没有响。");
        return;
      }
      state.currentCall = buildPhoneCall();
      $("phoneText").textContent = state.currentCall.text;
      $("phoneChoices").innerHTML = "";
      state.currentCall.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = choice.label;
        btn.addEventListener("click", () => answerPhone(choice));
        $("phoneChoices").appendChild(btn);
      });
      openModal("phoneModal");
    });

    renderCompanies();
    renderUpgrades();
    renderManualTraining();
    renderAiStore();
    renderChallenge();
    drawChart();
    updateHud();
