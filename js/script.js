
const BOARD_WEIGHTS = [
    [30, -12, 0, -1, -1, 0, -12, 30],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [30, -12, 0, -1, -1, 0, -12, 30]
];

const BOARD_SIZE = 8;
//0で初期化された8*8の二次元配列を生成、要素は0で初期化、空ではない
//最初のfillがnull代入しているのはmapメソッドを機能させるため、またこの時点でのfill(0)は値ではなく参照になるため生成した要素がすべて同じ参照になる
let currentPlayer = 1; 
let bingoCards = { 1: [], 2: [] };
let isGameOver = false;
//ゲーム開始時に動く関数
function initGame() {
    // ゲーム終了フラグ解除
    isGameOver = false;
    // ターンを黒(1)にする(2は白、CPU）
    currentPlayer = 1;
    //盤面初期化
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    //初期配置の石を設置
    board[3][3] = 2; board[3][4] = 1;
    board[4][3] = 1; board[4][4] = 2;
    //ビンゴカードを2枚用意
    bingoCards[1] = generateBingoNumbers();
    bingoCards[2] = generateBingoNumbers();
    //もう一度遊ぶの表示をリセット
    document.getElementById('status').innerHTML = "";
    //盤面とビンゴカードを作る関数を実行
    renderBoard();
    renderBingo();
    

}
//8*8の全座標をランダムに並べ替えて25個切り出してビンゴカードに代入
function generateBingoNumbers() {
    let coords = [];
    for(let r=0; r<8; r++) for(let c=0; c<8; c++) coords.push({r, c});
    return coords.sort(() => Math.random() - 0.5).slice(0, 25);
}
//盤面の操作と表示の更新、
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    boardEl.appendChild(document.createElement('div'));//左上labelの交差部分を空白にする
    // 列ラベル A-Hを表示
    for (let c = 0; c < BOARD_SIZE; c++) {
        const label = document.createElement('div');
        label.className = 'label';//1の部文はlabelとしてインデックスを表示
        label.textContent = String.fromCharCode(65 + c);//65はAからcの値を足してHまで
        boardEl.appendChild(label);
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
        // 行ラベル 1-8を表示
        const rowLabel = document.createElement('div');
        rowLabel.className = 'label';
        rowLabel.textContent = r + 1;
        boardEl.appendChild(rowLabel);

        for (let c = 0; c < BOARD_SIZE; c++) {
            //オセロの8*8マス部分をcell
            const cell = document.createElement('div');
            cell.className = 'cell';
            const flips = getFlips(r, c, currentPlayer);//flipsで石を置ける変数を保持
            
            // 石の描画
            const stone = document.createElement('div');
            stone.className = 'stone' + (board[r][c] === 1 ? ' black' : board[r][c] === 2 ? ' white' : '');
            cell.appendChild(stone);

            // 設置可能ヒントの表示
            if (board[r][c] === 0 && flips.length > 0) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                cell.appendChild(hint);

                // クリックイベント石を置く
                cell.onclick = () => handleMove(r, c, flips);

                // マウスオーバーイベント：ビンゴカードの文字色を変える
                cell.onmouseenter = () => highlightBingoEffect(flips, true);
                cell.onmouseleave = () => highlightBingoEffect(flips, false);
            }
            //盤面のデータを更新（DOM更新）

            boardEl.appendChild(cell);
        }
    }
}
//ビンゴカードの操作と更新
function renderBingo() {
    [1, 2].forEach(pNum => {
        const container = document.getElementById(`bingo-${pNum}`);
        container.innerHTML = '';
        bingoCards[pNum].forEach((coord, index) => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            // 座標を A1 形式で表示
            cell.textContent = String.fromCharCode(65 + coord.c) + (coord.r + 1);
            cell.id = `bingo-${pNum}-${coord.r}-${coord.c}`;
            
            if (board[coord.r][coord.c] === 1) cell.classList.add('hit-black');
            if (board[coord.r][coord.c] === 2) cell.classList.add('hit-white');
            
            container.appendChild(cell);
        });
    });
}
// 現在のプレイヤーのビンゴカード内で、色が変わる予定のマスをハイライト
function highlightBingoEffect(flips, isEnter) {
    flips.forEach(f => {
        const bingoCell = document.getElementById(`bingo-${currentPlayer}-${f.r}-${f.c}`);
        if (bingoCell) {
            if (isEnter) bingoCell.classList.add('bingo-highlight');
            else bingoCell.classList.remove('bingo-highlight');
        }
    });
}
//プレイヤー、CPUのターン動作
function handleMove(r, c, flips) {
    if (isGameOver) return;
    
    board[r][c] = currentPlayer;
    flips.forEach(f => board[f.r][f.c] = currentPlayer);
    
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    
    renderBoard();
    renderBingo();
    checkBingoWinner();

    // 置ける場所があるかチェック
    if (!canMove(currentPlayer)) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        if (!canMove(currentPlayer)) {
            endGame("BOARD_FULL");
        } else {
            alert((currentPlayer === 1 ? "" : "") + "置ける場所がないためパスします。");
            renderBoard();
        }
    }
    //ターン変更
    if (!isGameOver) {
        document.getElementById('status').textContent = `${currentPlayer === 1 ? '黒' : '白'}の番です`;
    }
    if (currentPlayer === 2) {
        cpuMove();
    }
}
//石を置く
function canMove(player) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === 0 && getFlips(r, c, player).length > 0) return true;
        }
    }
    return false;
}
//石をひっくり返す
function getFlips(r, c, player) {
    if (board[r][c] !== 0) return [];
    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let totalFlips = [];
    directions.forEach(([dr, dc]) => {
        let temp = [];
        let currR = r + dr, currC = c + dc;
        while(currR>=0 && currR<8 && currC>=0 && currC<8) {
            if(board[currR][currC] === 0) break;
            if(board[currR][currC] === player) {
                totalFlips = totalFlips.concat(temp);
                break;
            }
            temp.push({r: currR, c: currC});
            currR += dr; currC += dc;
        }
    });
    return totalFlips;
}

// CPUの思考ルーチン
function cpuMove() {
    if (isGameOver || currentPlayer !== 2) return; // CPUが白(2)と仮定

    let bestScore = -Infinity;
    let bestMoves = [];

    // 置ける場所をすべてリストアップ
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const flips = getFlips(r, c, 2);
            if (flips.length > 0) {
                const score = evaluateMove(r, c, flips);
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ r, c, flips }];
                } else if (score === bestScore) {
                    bestMoves.push({ r, c, flips });
                }
            }
        }
    }

    if (bestMoves.length > 0) {
        // 同じスコアならランダムに選択
        const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        // 少し遅延させて実行
        setTimeout(() => handleMove(move.r, move.c, move.flips), 500);
    }
}

//座標の評価関数
function evaluateMove(r, c, flips) {
    let score = 0;

    //盤面重みの加算
    score += BOARD_WEIGHTS[r][c];

    //ビンゴカードへの影響を評価
    //自分が白(2)、相手が黒(1)
    score += calculateBingoScore(r, c, 2) * 50; //CPUのリーチ・進行を最優先
    score += calculateBingoScore(r, c, 1) * 40; //プレイヤーの阻止を次点に

    //裏返せる石の数（微調整）
    score += flips.length;

    return score;
}

//指定したプレイヤーのビンゴカードにおけるその座標の価値を計算
function calculateBingoScore(r, c, pNum) {
    let moveValue = 0;
    const card = bingoCards[pNum];
    
    //その座標がビンゴカードに含まれているか
    const cardIndex = card.findIndex(coord => coord.r === r && coord.c === c);
    if (cardIndex === -1) return 0;

    //どのライン(縦・横・斜め)に属しているかチェック
    const row = Math.floor(cardIndex / 5);
    const col = cardIndex % 5;
    
    //関連するラインの状態を取得してスコアリング
    //例：リーチ状態なら高得点、既に相手に取られているラインなら低得点
    const lines = getRelatedLines(cardIndex);
    lines.forEach(lineIndices => {
        let count = 0;
        let blocked = false;
        lineIndices.forEach(idx => {
            const coord = card[idx];
            if (board[coord.r][coord.c] === pNum) count++;
            else if (board[coord.r][coord.c] !== 0) blocked = true; //相手の石がある
        });

        if (!blocked) {
            //揃う可能性が高いほど加点(リーチは特に高く)
            if (count === 4) moveValue += 100; //あと1つでビンゴ
            else if (count === 3) moveValue += 30;
            else moveValue += 10;
        }
    });

    return moveValue;
}

//ビンゴカード内のインデックスから関連するライン(縦横斜め)のインデックス配列を返す
function getRelatedLines(idx) {
    const r = Math.floor(idx / 5);
    const c = idx % 5;
    const lines = [];
    
    //横
    lines.push([r*5, r*5+1, r*5+2, r*5+3, r*5+4]);
    //縦
    lines.push([c, c+5, c+10, c+15, c+20]);
    //斜め
    if (idx % 6 === 0) lines.push([0, 6, 12, 18, 24]);
    if (idx !== 0 && idx !== 24 && idx % 4 === 0) lines.push([4, 8, 12, 16, 20]);
    
    return lines;
}
//ビンゴで決着した時
function checkBingoWinner() {
    [1, 2].forEach(pNum => {
        const card = bingoCards[pNum];
        const states = card.map(coord => board[coord.r][coord.c] === pNum);
        let win = false;
        for(let i=0; i<5; i++) {
            if(states.slice(i*5, i*5+5).every(v => v)) win = true; //横
            if([0,1,2,3,4].every(j => states[i + j*5])) win = true; //縦
        }
        if([0,6,12,18,24].every(i => states[i])) win = true; //斜め
        if([4,8,12,16,20].every(i => states[i])) win = true; //斜め

        if(win) {
            isGameOver = true;
            document.getElementById('status').innerHTML = `<div class="game-over">BINGO! ${pNum === 1 ? '黒' : '白'}の勝利です！<br>
            <button onclick="initGame()" class="retry-btn">もう一度遊ぶ</button></div>`;
        }
    });
}
//オセロで決着した時
function endGame(reason) {
    isGameOver = true;
    let black = 0, white = 0;
    board.forEach(row => row.forEach(cell => {
        if (cell === 1) black++;
        if (cell === 2) white++;
    }));
    const winner = black > white ? "黒" : white > black ? "白" : "引き分け";
    document.getElementById('status').innerHTML = `<div class="game-over">終了！ ${black}対${white}で${winner}の勝ち
        <br>
        <button onclick="initGame()" class="retry-btn">もう一度遊ぶ</button>
        </div>`;
}

initGame();