let video;
let handPose;
let hands = [];

// 系統狀態：LOADING (初始化), PLAYING (進行中)
let systemState = "LOADING"; 
let bootProgress = 0; // 模擬科技感進度條

// 遊戲邏輯與計分
let score = 0;
let itemX, itemY;
let itemSpeed = 4;
let itemType = ""; 
let itemName = "";

let bucketX;
let bucketTargetX;
let bucketY;
const BUCKET_WIDTH = 150;
const BUCKET_HEIGHT = 50;

// 未來風科技電子廢棄物資料庫 (全中文)
const recyclableItems = ["⚡ 鋰電池核心", "💾 古董量子磁碟", "🔌 奈米導體線材", "📱 報廢微處理器"];
const trashItems = ["☢️ 變異輻射廢料", "⚠️ 汙損工業機油", "📦 裂解高分子塑料", "🧪 劇毒實驗殘渣"];

let currentGesture = "核心防禦系統啟動中...";

function preload() {
    // 初始化最新 handPose 模型
    handPose = ml5.handPose();
}

function setup() {
    // 綁定 HTML 容器
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    rectMode(CENTER);

    // 開啟攝影機
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // 啟動 AI 手勢追蹤
    handPose.detectStart(video, gotHands);

    // 初始化物件數據
    resetItem();
    bucketX = width / 2;
    bucketY = height - 70;
    bucketTargetX = width / 2;
}

function gotHands(results) {
    hands = results;
    // 一旦 AI 成功接收到手勢訊號，且進度條跑完，就切換到遊戲畫面
    if (systemState === "LOADING" && bootProgress >= 100) {
        systemState = "PLAYING";
    }
}

function draw() {
    // 攝影機水平鏡像翻轉
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    // 賽博朋克極深藍黑科技濾鏡
    background(10, 10, 20, 210);

    // 根據系統狀態渲染不同畫面
    if (systemState === "LOADING") {
        drawLoadingScreen();
    } else if (systemState === "PLAYING") {
        drawGameCore();
    }
}

// 🤖 預備開始畫面（科技感載入特效）
function drawLoadingScreen() {
    // 讓進度條平滑上升到 100%
    if (bootProgress < 100) {
        bootProgress += 1.5;
    }

    // 畫出科技感外框
    stroke(0, 242, 254, 80);
    strokeWeight(1);
    noFill();
    rect(width / 2, height / 2, 400, 200, 8);
    
    // 角邊科技線條
    stroke(0, 242, 254, 200);
    line(width/2 - 200, height/2 - 100, width/2 - 200, height/2 - 80);
    line(width/2 - 200, height/2 - 100, width/2 - 180, height/2 - 100);
    line(width/2 + 200, height/2 + 100, width/2 + 200, height/2 + 80);
    line(width/2 + 200, height/2 + 100, width/2 + 180, height/2 + 100);

    // 載入中文字
    noStroke();
    fill(0, 242, 254);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("// 系統初始化中 //", width / 2, height / 2 - 40);
    
    textSize(14);
    fill(255, 200);
    let displayPercent = min(floor(bootProgress), 100);
    text("AI 影像辨識矩陣讀取中... " + displayPercent + "%", width / 2, height / 2);

    // 科技感外流光進度條
    noFill();
    stroke(0, 242, 254, 50);
    rect(width / 2, height / 2 + 40, 250, 12, 6);
    
    fill(0, 242, 254, 200);
    noStroke();
    let currentBarWidth = map(displayPercent, 0, 100, 0, 246);
    rectMode(LEFT); // 切換模式來畫進度條長度
    rect(width / 2 - 123, height / 2 + 40, currentBarWidth, 8, 4);
    rectMode(CENTER); // 換回中央模式

    // 最下方提示
    fill(255, 120);
    textSize(12);
    if (displayPercent >= 100) {
        fill(0, 255, 153);
        text(">> 請將手掌移入鏡頭範圍以啟動系統 <<", width / 2, height / 2 + 75);
    } else {
        text("正在安全連線至 ml5.js 神經網路...", width / 2, height / 2 + 75);
    }
}

// 🎮 遊戲核心畫面
function drawGameCore() {
    // 1. 繪製 HUD 教學分類框
    drawTechHUD();

    // 2. 處理手勢辨識與鏡像座標
    processHandTracking();

    // 3. 處理掉落物件
    manageFallingObjects();

    // 4. 更新能量防護盾（垃圾桶）
    updateTechBucket();

    // 5. 繪製主控台 UI
    drawUI();
}

// 繪製全中文 HUD 介面
function drawTechHUD() {
    strokeWeight(1);
    
    // 左側：資源回收節點 (螢光綠)
    fill(0, 255, 153, 12);
    stroke(0, 255, 153, 60);
    rect(width * 0.25, height / 2, width / 2 - 15, height - 30, 8);
    
    // 右側：一般垃圾節點 (螢光粉紅)
    fill(255, 0, 127, 12);
    stroke(255, 0, 127, 60);
    rect(width * 0.75, height / 2, width / 2 - 15, height - 30, 8);

    // 中文科幻文本提示
    noStroke();
    textSize(13);
    fill(0, 255, 153);
    textAlign(LEFT, TOP);
    text(">> 【核心回收矩陣】\n🖐️ 請張開手掌\n(適用: 電池 / 晶片 / 線材)", 25, 30);

    fill(255, 0, 127);
    textAlign(RIGHT, TOP);
    text("【終端廢料矩陣】 <<\n✊ 請兩指捏緊或握拳\n(適用: 輻射 / 機油 / 塑料)", width - 25, 30);
}

function processHandTracking() {
    if (hands.length > 0) {
        let hand = hands[0];
        
        // 鏡像座標轉換
        let thumbX = width - hand.thumb_tip.x;
        let thumbY = hand.thumb_tip.y;
        let indexX = width - hand.index_finger_tip.x;
        let indexY = hand.index_finger_tip.y;

        let d = dist(thumbX, thumbY, indexX, indexY);

        // 繪製追蹤粒子
        for (let i = 0; i < hand.keypoints.length; i++) {
            let kp = hand.keypoints[i];
            let kX = width - kp.x;
            let kY = kp.y;
            
            fill(0, 242, 254, 220);
            noStroke();
            ellipse(kX, kY, 6, 6);
        }

        // 手勢判定與雷射束
        if (d < 50) { 
            currentGesture = "防禦狀態: 偵測到脈衝拳壓 // 磁場調向右側";
            bucketTargetX = width * 0.75;
            
            stroke(255, 0, 127, 230);
            strokeWeight(3);
            line(thumbX, thumbY, indexX, indexY);
            
            fill(255, 0, 127);
            noStroke();
            ellipse((thumbX + indexX) / 2, (thumbY + indexY) / 2, 10, 10);
        } else if (d > 85) {
            currentGesture = "防禦狀態: 偵測到全面張力 // 磁場調向左側";
            bucketTargetX = width * 0.25;
            
            stroke(0, 255, 153, 230);
            strokeWeight(2);
            line(thumbX, thumbY, indexX, indexY);
        }
    } else {
        currentGesture = "安全警告: 未偵測到生物手勢訊號...";
    }
}

function resetItem() {
    itemY = -30;
    itemX = random(120, width - 120);
    itemSpeed = random(4, 5.5) + (score * 0.05);

    if (random(1) > 0.5) {
        itemType = "RECYCLABLE";
        itemName = random(recyclableItems);
    } else {
        itemType = "TRASH";
        itemName = random(trashItems);
    }
}

function manageFallingObjects() {
    itemY += itemSpeed;

    // 懸浮晶片字卡
    push();
    stroke(0, 242, 254, 200);
    strokeWeight(1.5);
    fill(5, 10, 25, 240);
    rect(itemX, itemY, 150, 36, 4); // 稍微加寬容納中文

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(13);
    text(itemName, itemX, itemY);
    pop();

    // 碰撞偵測
    if (itemY >= bucketY - BUCKET_HEIGHT/2 && itemY <= bucketY + BUCKET_HEIGHT/2) {
        if (itemX > bucketX - BUCKET_WIDTH/2 && itemX < bucketX + BUCKET_WIDTH/2) {
            if ((itemType === "RECYCLABLE" && bucketX < width/2) || 
                (itemType === "TRASH" && bucketX > width/2)) {
                score += 10;
            } else {
                score = max(0, score - 5);
            }
            resetItem();
        }
    }

    if (itemY > height + 40) {
        resetItem();
    }
}

function updateTechBucket() {
    bucketX = lerp(bucketX, bucketTargetX, 0.16);

    push();
    if (bucketX < width / 2) {
        stroke(0, 255, 153);
        fill(0, 255, 153, 35);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(0, 255, 153, 0.7)';
    } else {
        stroke(255, 0, 127);
        fill(255, 0, 127, 35);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(255, 0, 127, 0.7)';
    }
    
    strokeWeight(2);
    rect(bucketX, bucketY, BUCKET_WIDTH, BUCKET_HEIGHT, 5);

    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(bucketX < width / 2 ? "【 資源回收磁場 】" : " 【 一般廢料磁場 】", bucketX, bucketY);
    pop();
}

function drawUI() {
    // 頂端核心分數
    fill(0, 242, 254);
    noStroke();
    textSize(20);
    textAlign(CENTER, TOP);
    text("核心同步積分: " + score, width / 2, 25);

    // 底部全中文主控台數據列
    rectMode(CENTER);
    fill(5, 5, 12, 240);
    stroke(0, 242, 254, 70);
    strokeWeight(1);
    rect(width / 2, height - 25, 480, 26, 4);

    noStroke();
    fill(0, 242, 254);
    textSize(11);
    textAlign(CENTER, CENTER);
    text(currentGesture, width / 2, height - 25);
}