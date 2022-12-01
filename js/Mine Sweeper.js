'use strict'
console.log('Mine Sweeper')

const MINE = 'mine'
const BOMB = '&#128163'
const flag = '&#128681'
const VICTORY_SOUND = new Audio('sound/victory.wav')
const BOMB_SOUND = new Audio('sound/bomb.wav')
const BLOW_UP_SOUND = new Audio('sound/blow-up.wav')
const LOSE_SOUND = new Audio('sound/lose.wav')

var isVictory = false
var isSilent = false
var isFirstClick
var isMinesAdd
var isHintCell

var gLifeGame
var gBoard
var gMineBlowd
var gCurrLigth
var gRestartColorInterval
var gFlag = 4
var gSlctdOptnCount = 0
var gLevel = {
    SIZE: 4,
    MINE: 2
}
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

function initGame() {
    gGame.isOn = true
    isFirstClick = true
    isMinesAdd = false
    isHintCell = false
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    gLifeGame = 3
    gMineBlowd = 0
    gBoard = createMat(gLevel.SIZE, gLevel.SIZE)
    gBoard = buildBoard(gBoard)
    renderBoard(gBoard)
}

function chooseLevel(level) {
    gSlctdOptnCount++
    if (gSlctdOptnCount < 2) return
    if (level === '1') {
        gLevel.SIZE = 4
        gLevel.MINE = 2
        gFlag = 4
    } else if (level === '2') {
        gLevel.SIZE = 8
        gLevel.MINE = 14
        gFlag = 20
    } else if (level === '3') {
        gLevel.SIZE = 12
        gLevel.MINE = 32
        gFlag = 40
    }
    gSlctdOptnCount = 0
    changeText('.flags-count', gFlag)
    restart()
}

function hint(ligth) {
    if (!gGame.isOn) return
    if (ligth === '1') gCurrLigth = '.hint-1'
    else if (ligth === '2') gCurrLigth = '.hint-2'
    else if (ligth === '3') gCurrLigth = '.hint-3'
    changeBackground(gCurrLigth, '0')
    changeBackground(gCurrLigth, 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(195,110,110,1) 0%, rgba(170,145,180,1) 100%, rgba(162,156,203,1) 100%, rgba(146,178,247,1) 100%)')
    isHintCell = true
}

function chooseCellForHint(cell) {
    var location
    var cell
    var currNegs = []

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue
            currNegs.push({ i, j })
        }
    }
    for (var i = 0; i < currNegs.length; i++) {
        cell = { i: currNegs[i].i, j: currNegs[i].j }
        location = gBoard[cell.i][cell.j]
        if (location.isMine) renderCell(cell, BOMB)
        else if (location.isMine === false) renderCell(cell, location.minesAroundCount)
    }
    setTimeout(() => {
        for (var i = 0; i < currNegs.length; i++) {
            cell = { i: currNegs[i].i, j: currNegs[i].j }
            renderCell(cell, '')
        }
        changeText(gCurrLigth, '')
    }, 1000)
    isHintCell = false
}

function restart() {
    clearInterval(gRestartColorInterval)
    gRestartColorInterval = null
    initGame()
    changeEmoji('&#128578')
    changePopacity('.bless', '0')
    changeColor('.life-1', '#ff000098')
    changeColor('.life-2', '#ff000098')
    changeColor('.life-3', '#ff000098')
    if (gGame.isOn) TemporaryDiscoloration('.restart', 300)
    changeHtml('.hints', `<div>
    <span onclick="hint(id)" id="1" class="hint hint-1">&#128161</span></div><div><span onclick="hint(id)" id="2" class="hint hint-2">&#128161</span></div><div><span onclick="hint(id)" id="3" class="hint hint-3">&#128161</span></div>`)
}

function renderBoard(board) {
    var strHtml = '<tr>'
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {

            strHtml += `<td class=" cell cell-${i}-${j}" onclick="blowUp(${i},${j})" oncontextmenu="cellMarked(${i},${j})">`

            strHtml += `\t</td\n>`
        }
        strHtml += `</tr>\n`
    }
    changeHtml('.board', strHtml)
    changeText('.mines-count', gLevel.MINE - gMineBlowd)
    changeText('.flags-count', gFlag)
}

function buildBoard(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = {
                type: null,
                gameElement: '',
                isShown: false,
                isMarked: false,
                isMine: false,
                minesAroundCount: 0
            }
        }
    }
    return board
}

function addMineSweeper(board) {
    var counter = 0
    while (counter !== gLevel.MINE) {
        var emptyCell = findEmptyCell(board)
        board[emptyCell.i][emptyCell.j].type = MINE
        board[emptyCell.i][emptyCell.j].isMine = true
        counter++
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            for (var I = i - 1; I <= i + 1; I++) {
                if (I < 0 || I > board.length - 1) continue
                for (var J = j - 1; J <= j + 1; J++) {
                    if (J < 0 || J > board[0].length - 1) continue
                    if (board[I][J].type === MINE) board[i][j].minesAroundCount++
                }
            }
        }
    }
}

function blowUp(i, j) {
    var value
    var cell = { i, j }
    var location
    if (gBoard[i][j].isMarked || gBoard[i][j].isShown || !gGame.isOn) return
    if (isHintCell) {
        chooseCellForHint(cell)
        return
    }
    gBoard[i][j].isShown = true
    if (!isSilent) BLOW_UP_SOUND.play()
    changeBackgroundColor(`.cell-${i}-${j}`, 'rgba(26, 48, 146, 0.067)')
    if (gBoard[i][j].isMine) {
        if (isFirstClick) return
        if (!isSilent) BOMB_SOUND.play()
        gLifeGame--
        gMineBlowd++
        changeText('.mines-count', gLevel.MINE - gMineBlowd - gGame.markedCount)
        if (gLifeGame >= 0) {
            changeColor(`.life-${gLifeGame + 1}`, 'black')
            blowUpNegs(cell)
        }
        if (gLifeGame <= 0) gameOver()
        value = BOMB
    } else {
        if (isFirstClick && !isMinesAdd) {
            addMineSweeper(gBoard)
            setMinesNegsCount(gBoard)
            isMinesAdd = true
        }
        location = gBoard[i][j]
        if (location.minesAroundCount > 0) value = location.minesAroundCount
        else {
            value = ''
            blowUpNegs(cell)
        }
        gGame.shownCount++
    }
    isFirstClick = false
    renderCell(cell, value)
    if (checkIfVicrory()) gameOver()
}

function blowUpNegs(cell) {
    var location

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue

            location = gBoard[i][j]
            if (location.isMarked || location.isShown) continue
            changeBackgroundColor(`.cell-${i}-${j}`, 'rgba(26, 48, 146, 0.067)')
            if (location.isMine) {
                if (isFirstClick) return
                blowUp(i, j)
            }
            else {
                if (location.minesAroundCount === 0) blowUp(i, j)
                else {
                    gGame.shownCount++
                    renderCell({ i, j }, location.minesAroundCount)
                    gBoard[i][j].isShown = true
                }
            }
        }
    }
}

function cellMarked(i, j) {
    if (gBoard[i][j].isMarked || gBoard[i][j].isShown || !gGame.isOn || gFlag === 0) return
    if (!gBoard[i][j].isMine) return
    var cell = { i, j }
    gFlag--
    gGame.markedCount++
    gBoard[i][j].isMarked = true
    changeText('.mines-count', gLevel.MINE - gMineBlowd - gGame.markedCount)
    renderCell(cell, flag)
    changeText('.flags-count', gFlag)
    if (checkIfVicrory()) gameOver()
}

function renderCell(location, value) {
    var cellSelector = '.' + getClassName(location)
    document.querySelector(cellSelector).innerHTML = value
}

function checkIfVicrory() {
    if (gGame.markedCount === gLevel.MINE - gMineBlowd && gGame.shownCount === (gLevel.SIZE ** 2) - gLevel.MINE) {
        isVictory = true
        return true
    }
    return false
}

function gameOver() {
    if (isVictory) {
        changeText('.bless', 'You win!')
        changeEmoji('&#128526')
        if (!isSilent) VICTORY_SOUND.play()
    }
    else {
        changeText('.bless', 'You lose...')
        changeEmoji('&#128565')
        if (!isSilent) setTimeout(() => { LOSE_SOUND.play() }, 500)
    }
    gGame.isOn = false
    changePopacity('.bless', '1')
    changeBackground('.restart', '')
    if (!gRestartColorInterval) {
        gRestartColorInterval = setInterval(() => {
            changeBackground('.restart', 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(195,110,110,1) 0%, rgba(170,145,180,1) 100%, rgba(162,156,203,1) 100%, rgba(146,178,247,1) 100%)')
            setTimeout(changeBackground, 100, '.restart', 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(75,91,144,1) 0%, rgba(146,178,247,1) 100%)')
        }, 200)
    }
}

function changeEmoji(emoji) {
    document.querySelector('.restart').innerHTML = emoji
}

function silent() {
    if (!isSilent) {
        isSilent = true
        document.querySelector('.silent').innerHTML = '&#128263'
    }
    else {
        isSilent = false
        document.querySelector('.silent').innerHTML = '&#128266'
    }
    TemporaryDiscoloration('.silent', 300)
}

function TemporaryDiscoloration(location, time) {
    changeBackground(location, '0')
    changeBackground(location, 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(195,110,110,1) 0%, rgba(170,145,180,1) 100%, rgba(162,156,203,1) 100%, rgba(146,178,247,1) 100%)')
    setTimeout(changeBackground, time, location, 'linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(75,91,144,1) 0%, rgba(146,178,247,1) 100%)')
}

function changePopacity(p, value) {
    document.querySelector(p).style.opacity = value
}

function changeText(location, newText) {
    document.querySelector(location).innerText = newText
}

function changeHtml(Location, value) {
    document.querySelector(Location).innerHTML = value
}

function changeBackgroundColor(location, color) {
    document.querySelector(location).style.backgroundColor = color
}

function changeBackground(location, value) {
    document.querySelector(location).style.background = value
}

function changeColor(location, color) {
    document.querySelector(location).style.color = color
}

function findEmptyCell(board) {
    var emptyCells = []
    for (var i = 1; i < board.length - 1; i++) {
        for (var j = 1; j < board[i].length - 1; j++) {
            if (board[i][j].type === null) emptyCells.push({ i, j })
        }
    }
    return emptyCells[getRandomInt(0, emptyCells.length)]
}

function getClassName(location) {
    var cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}

function createMat(rows, cols) {
    var mat = []
    for (var i = 0; i < rows; i++) {
        mat[i] = []
        for (var j = 0; j < cols; j++) {
            mat[i][j] = ''
        }
    }
    return mat
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min) + min)
}