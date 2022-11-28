import {
    LeaderBoardService,
    LoggerService,
    StorageService,
    TimerService
} from './modules';
import { levels } from './levels.js';

const TEST_MODE = false; // set to true if you want to test the game with visual hints and separate leaderboard
const VERSION = "0.3.12";
const MOBILE_BUSY_DELAY = 250;
const PC_BUSY_DELAY = 500;
const CASUAL_MODE = false;

export const Minesweeper = function(appId) {
    const _this = this;
    const storageService = new StorageService();
    const timerService = new TimerService();
    const loggerService = new LoggerService();
    const leaderBoard = new LeaderBoardService('mw-leaders', 'mw-all', 'mw-config');

    let grid = document.createElement('table');
    grid.setAttribute('id', 'grid');
    let flagsDisplay = document.createElement('span');
    let smileyDisplay = document.createElement('span');
    let timerDisplay = document.createElement('span');
    let footbar = document.createElement('div');
    let customWrapper = document.createElement('div');
    customWrapper.setAttribute('id', 'custom-wrapper');
    let appElement = document.getElementById(appId);
    if (!appElement) {
        const body = document.getElementsByTagName('body')[0];
        appElement = document.createElement('div');
        body.append(appElement);
    }
    let leaderWrapper = document.createElement('div');

    let isMobile = false;
    let isLeft = false;
    let isRight = false;
    let pressed = undefined;
    let bothPressed = undefined;
    let skip = false;
    let skipCondition = false;
    let mouseUpCallBackArray = [
        clickCell,
        middleClickCell,
    ];
    let mouseDownCallBackArray = [
        highlightCell, // left-click down
        highlightSurroundingCell, // middle-click down
        rightClickCell // right-click down
    ]
    let firstClick = true;
    let isBusy = false;
    let clickedCell;
    let cachedSetting = storageService.getFromLocal('setting');
    let setting = cachedSetting || levels.beginner;
    if (TEST_MODE) {
        setting = {
            rows: 10,
            cols: 10,
            mines: 10,
            name: 'test'
        }
    }
    storageService.saveToLocal('setting', setting);
    let flagsCount = setting.mines;
    let minesArray = [];

    this.initialize = function() {
        const headingElement = document.createElement('h1');
        const gameBoard = document.createElement('div');

        headingElement.innerText = `Minesweeper v${VERSION}`;
        gameBoard.setAttribute('id', 'game-board');
        gameBoard.append(initializeToolbar(), grid, initializeFootbar());
        appElement.innerHTML = '';
        appElement.append(headingElement, gameBoard);
        appElement.append(initializeSourceLink());

        generateGrid();
    }

    function initializeSourceLink() {
        const sourceLink = document.createElement('a');
        sourceLink.href = 'https://github.com/ayoayco/mnswpr';
        sourceLink.innerText = 'Source code';
        sourceLink.target = '_blank';
        sourceLink.style.color = 'white';

        return sourceLink;
    }

    function initializeLeaderBoard() {
        const title = `Best Times (${setting.name})`;
        leaderBoard.update(setting.name, leaderWrapper, title);

        appElement.append(leaderWrapper);
    }

    function initializeFootbar() {
        const footBar = document.createElement('div');

        const resetButton = document.createElement('button');
        resetButton.innerText = 'Reset';
        resetButton.onmousedown = () => generateGrid();
        footBar.append(resetButton);

        let levelsDropdown = document.createElement('select');
        levelsDropdown.onchange = () => updateSetting(levelsDropdown.value);

        const levelsKeys = Object.keys(levels);
        levelsKeys.forEach(key => {
            const levelOption = document.createElement('option');
            levelOption.value = levels[key].name;
            levelOption.text = capitalize(levels[key].name);
            if (setting.name === levelOption.value) {
                levelOption.selected = true;
            }
            levelsDropdown.add(levelOption, null);
        });

        // custom level
        // const customOption = document.createElement('option');
        // customOption.onmousedown = () => {}
        // customOption.value = 'custom';
        // customOption.text = 'Custom';
        // levelsDropdown.add(customOption);

        if (TEST_MODE) {
            const testLevel = document.createElement('span');
            testLevel.innerText = 'Test Mode';
            footBar.append(testLevel);
        } else {
            footBar.append(levelsDropdown);
        }

        return footBar;
    }

    function removeCustomOptions() {
        const customCopy = document.getElementById('custom-wrapper');
        if (customCopy) {
            footbar.removeChild(customWrapper);
        }
    }

    function insertCustomOptions() {
        
        const inputElements = [];

        const rowsInput = document.createElement('input');
        rowsInput.placeholder = 'Rows';
        inputElements.push(rowsInput);

        const colsInput = document.createElement('input');
        colsInput.placeholder = 'Columns';
        inputElements.push(colsInput);

        const bombsInput = document.createElement('input');
        bombsInput.placeholder = 'Bombs';
        inputElements.push(bombsInput);

        const okButton = document.createElement('button');
        okButton.innerText = 'Okay';
        const setting = {rows: rowsInput.value, cols: colsInput.value, bombs: bombsInput.value};
        okButton.onmousedown = () => updateSetting('custom-action', setting);

        inputElements.forEach(input => {
            input.style.marginRight = '15px';
            input.style.width = '100px';
            input.maxLength = 3;
            input.type = 'number';
            input.width = 50;
        });

        customWrapper.append(...inputElements, okButton);
        footbar.append(customWrapper);
    }

    function capitalize(str) {
        if (!str) return '';
        return `${str[0].toUpperCase()}${str.slice(1, str.length)}`;
    }

    function initializeToolbar() {
        const toolbar = document.createElement('div');
        const toolbarItems = [];

        const flagsWrapper = document.createElement('div');
        flagsWrapper.append(flagsDisplay)
        flagsWrapper.style.height = '20px';
        toolbar.append(flagsWrapper);
        toolbarItems.push(flagsWrapper);

        const smileyWrapper = document.createElement('div');
        smileyWrapper.append(smileyDisplay);
        // toolbar.append(smileyWrapper);
        // toolbarItems.push(smileyWrapper);

        const timerWrapper = document.createElement('div');
        timerWrapper.append(timerDisplay);
        timerWrapper.style.height = '20px';
        toolbar.append(timerWrapper);
        toolbarItems.push(timerWrapper);

        toolbar.style.cursor = 'pointer';
        toolbar.style.padding = '10px 35px';
        toolbar.style.display = 'flex';
        toolbar.style.justifyContent = 'space-between';
        toolbar.onmousedown = () => generateGrid();

        return toolbar;
    }

    function updateSetting(key, custom) {
        if (key === 'custom') {
            insertCustomOptions();
        } else if (key === 'custom-action') {
            console.log('custom', custom);
        } else {
            setting = levels[key];
            storageService.saveToLocal('setting', setting);
            removeCustomOptions();
            generateGrid();
        }
    }


    function generateGrid() {

        //generate 10 by 10 grid
        firstClick = true;
        grid.innerHTML = '';
        grid.oncontextmenu = () => false;
        flagsCount = setting.mines;
        minesArray = [];

        for (let i = 0; i < setting.rows; i++) {
            let row = grid.insertRow(i);
            row.oncontextmenu = () => false;
            for (let j=0; j<setting.cols; j++) {
                let cell = row.insertCell(j);
                initializeEventHandlers(cell);

                if ('ontouchstart' in document.documentElement) {
                    isMobile = true;
                    initializeTouchEventHandlers(cell);
                }

                let status = document.createAttribute("data-status");       
                status.value = "default";             
                cell.setAttributeNode(status);
            }
        }

        let gameStatus = document.createAttribute('game-status');
        gameStatus.value = 'inactive';
        grid.setAttributeNode(gameStatus);

        appElement.style.minWidth = '260px';
        appElement.style.width = `${grid.offsetWidth + 40}px`;
        appElement.style.margin = '0 auto';

        if (!CASUAL_MODE) {
            initializeLeaderBoard();
        }

        timerService.initialize(timerDisplay);
        updateFlagsCountDisplay();
        addMines(setting.mines);

        // send google analytics event
        if (gtag) {
            gtag('event', 'mw-event', {
                'event_category' : 'mw-game',
                'event_label' : 'loaded-game'
            });
        }

    }

    function setBusy() {
        isBusy = true;
        if (isMobile) {
            setTimeout(() => isBusy = false, MOBILE_BUSY_DELAY);
        } else {
            setTimeout(() => isBusy = false, PC_BUSY_DELAY);
        }
    }

    function updateFlagsCountDisplay(count = flagsCount) {
        if (grid.getAttribute('game-status') != 'win') {
            flagsDisplay.innerHTML = `${count}`;
            return;
        }
        flagsDisplay.innerHTML = '&#128513;';
    }

    function initializeTouchEventHandlers(_cell) {
        let cell = document.createElement('td');
        cell = _cell;

        let ontouchleave = function(e) {
            if (clickedCell === this) {
                clickedCell = undefined
            }
        }
        cell.addEventListener('touchleave', ontouchleave);

        let ontouchend = function(e) {
            endTouchTimer();
        }
        cell.addEventListener('touchend', ontouchend);

        let ontouchstart = function(e) {
            isMobile = true;
            if (!isBusy && typeof e === 'object') {
                startTouchTimer(this);
            }
        }
        cell.addEventListener('touchstart', ontouchstart);

    }

    function initializeEventHandlers(_cell) {

        let cell = document.createElement('td');
        cell = _cell;
        skip = false;
        skipCondition = false;

        resetMouseEventFlags();

        document.onkeydown = function(e) {
            if (e.keyCode == 32 || e.keyCode == 113) {
                generateGrid();
                if ('preventDefault' in e) {
                    e.preventDefault();
                } else {
                    return false;
                }
            }
            resetMouseEventFlags();
        }

        window.onblur = function() {
            resetMouseEventFlags();
        }

        grid.onmouseleave = function() {
            removeHighlights();
        }
        document.oncontextmenu = () => false;
        document.onmouseup = function() {
            resetMouseEventFlags();
        }
        document.onmousedown = function(e) {
            isMobile = false;
            switch (e.button) {
                case 0: pressed = 'left'; isLeft = true; break;
                case 1: pressed = 'middle'; break;
                case 2: isRight = true; break;
            }
        }

        // Set grid status to active on first click
        cell.onmouseup = function(e) {        
            pressed = undefined;
            let dont = false;

            if (bothPressed) {
                bothPressed = false;
                if (e.button == '2') {
                    skipCondition = true;
                } else if (e.button == '0') {
                    dont = true;
                }
                if (getStatus(this) == 'clicked') {
                    middleClickCell(this);
                    return;
                }
            }
            switch(e.button) {
                case 0: {
                    isLeft = false;
                    if (skipCondition) {
                        skip = true;
                    }
                    break;
                }
                case 2: isRight = false; break
            }
            removeHighlights();
            if (skip || dont) {
                skip = false;
                skipCondition = false;
                return;
            }
            if (!isBusy && typeof e === 'object' && e.button != '2') {
                mouseUpCallBackArray[e.button].call(_this, this);
            }
        }


        cell.onmousedown = function(e) {
            skip = false;
            if (!isBusy && typeof e === 'object') {
                switch(e.button) {
                    case 0: isLeft = true; break;
                    case 2: isRight = true; break
                }

                if (isLeft && isRight) {
                    bothPressed = true;
                    highlightSurroundingCell(this);
                    return;
                }

                if (e.button == '1') {
                    pressed = 'middle';
                    highlightSurroundingCell(this);
                } else if (e.button == '0') {
                    pressed = 'left';
                    if (getStatus(this) == 'clicked') {
                        highlightSurroundingCell(this);
                    } else {
                        highlightCell(this);
                    }
                }

                if (e.button == '2') mouseDownCallBackArray[e.button].call(_this, this);
            }
        }

        cell.onmousemove = function(e) {
            if ((pressed || bothPressed) && typeof e === 'object') {
                removeHighlights();
                /*
                if (!isEqual(clickedCell, cell)) {
                    clickedCell = undefined;
                }
                */
                if (pressed == 'middle' || (isLeft && isRight)) {
                    highlightSurroundingCell(this);
                } else if (pressed == 'left') {
                    if (getStatus(this) == 'clicked') {
                        highlightSurroundingCell(this);
                    } else {
                        highlightCell(this);
                    }
                }
            }
        }

        cell.oncontextmenu = () => false;
        cell.onselectstart = () => false;
        cell.setAttribute('unselectable', 'on');
    }

    function isEqual(x, y) {
        if (!x) return false;
        return x === y;
    }

    function startTouchTimer(cell) {
        if (isEqual(clickedCell, cell)) {
            return;
        }
        clickedCell = cell;
        setTimeout(() => {
            if (isEqual(clickedCell, cell)) {
                rightClickCell(cell);
                setBusy();
            }
        }, 500);
    }

    function endTouchTimer() {
        clickedCell = undefined;
    }

    function resetMouseEventFlags() {
            pressed = undefined;
            bothPressed = undefined;
            isLeft = false;
            isRight = false;
            removeHighlights();
            skip = true;
    }

    function addMines(minesCount) {
        //Add mines randomly
        for (let i=0; i<minesCount; i++) {
            let row = Math.floor(Math.random() * setting.rows);
            let col = Math.floor(Math.random() * setting.cols);
            let cell = grid.rows[row].cells[col];
            if (isMine(cell)) {
                transferMine();
            } else {
                minesArray.push([row, col]);
            }
            if (TEST_MODE){
                cell.innerHTML = 'X';
            }
        }
        if (TEST_MODE) {
            printMines();
        }
    }

    function revealMines() {
        if (grid.getAttribute('game-status') == 'done') return;
        //Highlight all mines in red
        const win = grid.getAttribute('game-status') == 'win';
        for (let i=0; i<setting.rows; i++) {
            for(let j=0; j<setting.cols; j++) {
                let cell = grid.rows[i].cells[j];
                if (win) {
                    handleWinRevelation(cell);
                } else {
                    handleLostRevelation(cell);
                }
            }
        }
        grid.setAttribute('game-status', 'done');

        const time = timerService.stop();
        const game = {
            time,
            status: win ? 'win' : 'loss',
            level: setting.name,
            time_stamp: new Date(),
            isMobile
        }

        if (!TEST_MODE) {
            leaderBoard.send(game, 'time');
        }

        // send google analytics event
        if (gtag) {
            gtag('event', 'mw-event', {
                'event_category' : 'mw-game',
                'event_label' : 'ended-game'
            });
        }
    }

    function handleWinRevelation(cell) {
        updateFlagsCountDisplay(0);
        if (isMine(cell)) {
            cell.innerHTML = ':)'
            cell.className = 'correct';
            setStatus(cell, 'clicked');
            let correct = document.createAttribute('title');
            correct.value = 'Correct';
            cell.setAttributeNode(correct)
            setStatus(cell, 'clicked');
        }
    }

    function handleLostRevelation(cell) {
        if (isFlagged(cell)) {
            cell.className = 'flag'
            if (!isMine(cell)) {
                cell.innerHTML = 'X';
                cell.className = 'wrong';
                let wrong = document.createAttribute('title');
                wrong.value = 'Wrong';
                cell.setAttributeNode(wrong);
            } else {
                cell.innerHTML = ':)'
                cell.className = 'correct';
                let correct = document.createAttribute('title');
                correct.value = 'Correct';
                cell.setAttributeNode(correct);
            }
        } else {
            if (isMine(cell)) {
                cell.className = 'mine';
                setStatus(cell, 'clicked');
            }
        }
    }

    function isOpen(cell) {
        return cell.innerHTML !== '' && !isFlagged(cell);
    }

    function isFlagged(cell) {
        return getStatus(cell) == 'flagged';
    }

    function isMine(cell) {
        return getIndex(minesArray, cell) > -1;
    }

    function removeItem(arr, cell) {
        const index = getIndex(arr, cell);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }

    function getIndex(arr, cell) {
        const row = cell.parentNode.rowIndex;
        const col = cell.cellIndex;
        let index = -1;
        for (let i = 0; i < arr.length; i++) {
            let rowCol = arr[i]
            if (rowCol[0] === row && rowCol[1] === col) {
                index = i;
                break;
            }
        }

        return index;
    }

    function checkLevelCompletion() {
        let levelComplete = true;
            for (let i=0; i<setting.rows; i++) {
            for(let j=0; j<setting.cols; j++) {
                const cell = grid.rows[i].cells[j]; 
                if (!isMine(cell) && cell.innerHTML=="") levelComplete=false;
            }
        }
        if (levelComplete && grid.getAttribute('game-status') == 'active') {
            grid.setAttribute('game-status', 'win');
            revealMines();
        }
    }

    function setStatus(cell, status) {
        cell.setAttribute('data-status', status);
    }

    function getCol(cell) {
        return cell.cellIndex;
    }

    function getRow(cell) {
        return cell.parentNode.rowIndex;
    }

    function getStatus(cell) {
        if (!cell) return undefined;
        return cell.getAttribute('data-status');
    }

    function middleClickCell(cell) {
        if (grid.getAttribute('game-status') != 'active' || getStatus(cell) !== 'clicked') {
            return;
        }
        // check for number of surrounding flags
        const valueString = cell.getAttribute('data-value');
        let cellValue = parseInt(valueString, 10);
        let flagCount = countFlagsAround(cell);

        if (flagCount === cellValue) {
            clickSurrounding(cell);
            if (TEST_MODE) loggerService.debug('middle click', cell);
        }
    }

    function countFlagsAround(cell) {
        let flagCount = 0;
        let cellRow = cell.parentNode.rowIndex;
        let cellCol = cell.cellIndex;
        for (let i = Math.max(cellRow-1,0); i <= Math.min(cellRow+1, setting.rows - 1); i++) {
            for(let j = Math.max(cellCol-1,0); j <= Math.min(cellCol+1, setting.cols - 1); j++) {
                if (isFlagged(grid.rows[i].cells[j])) flagCount++;
            }
        }
        return flagCount;
    }

    function clickSurrounding(cell) {
        if (grid.getAttribute('game-status') != 'active') return;
        let cellRow = cell.parentNode.rowIndex;
        let cellCol = cell.cellIndex;
        for (let i = Math.max(cellRow-1,0); i <= Math.min(cellRow+1, setting.rows - 1); i++) {
            for(let j = Math.max(cellCol-1,0); j <= Math.min(cellCol+1, setting.cols - 1); j++) {
                let currentCell = grid.rows[i].cells[j];
                if (getStatus(currentCell) == 'flagged') continue;
                openCell(currentCell);
            }
        }
    }

    function increaseFlagsCount() {
        flagsCount++;
        updateFlagsCountDisplay();
    }

    function decreaseFlagsCount() {
        flagsCount--;
        updateFlagsCountDisplay();
    }

    function activateGame() {
        grid.setAttribute('game-status', 'active');
        // start timer
        timerService.start();
        // send google analytics event
        if (gtag) {
            gtag('event', 'mw-event', {
                'event_category' : 'mw-game',
                'event_label' : 'activated-game'
            });
        }
    }

    function gameIsDone() {
        return grid.getAttribute('game-status') == 'over' || grid.getAttribute('game-status') == 'done';
    }

    function removeHighlights() {
        for (let i=0; i<setting.rows; i++) {
            const rows = grid.rows[i];
            if (!rows) continue;
            for(let j=0; j<setting.cols; j++) {
                let currentCell = grid.rows[i].cells[j];
                if (getStatus(currentCell) == 'highlighted') setStatus(currentCell, 'default');
            }
        }
    }

    function highlightCell(cell) {
        if (isFlagged(cell)) return;
        if (!gameIsDone() && getStatus(cell) == 'default') setStatus(cell, 'highlighted'); // currentCell.classList.add('highlight');
    }

    function highlightSurroundingCell(cell) {
        let cellRow = cell.parentNode.rowIndex;
        let cellCol = cell.cellIndex;

        highlightCell(cell);
        for (let i = Math.max(cellRow-1,0); i <= Math.min(cellRow+1, setting.rows - 1); i++) {
            for(let j = Math.max(cellCol-1,0); j <= Math.min(cellCol+1, setting.cols - 1); j++) {
                let currentCell = grid.rows[i].cells[j];
                highlightCell(currentCell);
            }
        }
    }

    function rightClickCell(cell) {
        if (isFlagged(cell)) setBusy();
        if (grid.getAttribute('game-status') == 'inactive') {
            activateGame();
        }
        if (grid.getAttribute('game-status') != 'active') return;
        if (getStatus(cell) != 'clicked' && getStatus(cell) != 'empty') {
            if (getStatus(cell) == 'default' || getStatus(cell) == 'highlighted') {
                if (flagsCount <= 0) return;
                cell.className = 'flag';
                decreaseFlagsCount();
                setStatus(cell, 'flagged');
            } else {
                cell.className = '';
                increaseFlagsCount();
                setStatus(cell, 'default');
            }
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            if (TEST_MODE) loggerService.debug('right click', cell);
        }
    }

    function clickCell(cell) {
        if (isFlagged(cell)) setBusy();
        if (grid.getAttribute('game-status') == 'inactive') {
            activateGame();
        }
        if (grid.getAttribute('game-status') != 'active') return;
        //Check if the end-user clicked on a mine
        if (TEST_MODE) loggerService.debug('click', cell);
        if (getStatus(cell) == 'flagged' || grid.getAttribute('game-status') == 'over') {
            return;
        } else if (getStatus(cell) == 'clicked') {
            middleClickCell(cell);
            return
        } else if (isMine(cell) && firstClick) {
            // cell.setAttribute('data-mine', 'false');
            removeItem(minesArray, cell);
            transferMine(cell);
            if (TEST_MODE) printMines();
        }

        openCell(cell);
    }

    function printMines() {
        let count = 0;
        for (let i = 0; i < setting.rows; i++) {
            for (let j = 0; j < setting.cols; j++) {
                if (isMine(grid.rows[i].cells[j])) {
                    loggerService.debug(count++ + ' - mine: [' + i + ',' + j + ']');
                }
            }
        }
    }

    function transferMine(cell = undefined) {
        let found = false;
        do {
            let row = Math.floor(Math.random() * setting.rows);
            let col = Math.floor(Math.random() * setting.cols);
            const transferMineToCell = grid.rows[row].cells[col];
            if (isMine(transferMineToCell) || isNeighbor(cell, transferMineToCell)) {
                continue;
            } else {
                minesArray.push([row, col]);
                if (TEST_MODE){
                    transferMineToCell.innerHTML = 'X';
                    if (TEST_MODE) loggerService.debug('transferred mine to: ' + row + ', ' + col);
                }
                found = true;
                return;
            }
        } while(!found)
    }

    function isNeighbor(cell, nextCell) {
        if (cell === undefined) {
            return;
        }
        const rowDifference = Math.abs(getRow(cell) - getRow(nextCell));
        const colDifference = Math.abs(getCol(cell) - getCol(nextCell));

        return (rowDifference === 1) && (colDifference === 1);
    }

    function countMinesAround(cell) {
        let mineCount=0;
        let cellRow = cell.parentNode.rowIndex;
        let cellCol = cell.cellIndex;
        for (let i = Math.max(cellRow-1,0); i <= Math.min(cellRow+1,setting.rows-1); i++) {
            const rows = grid.rows[i];
            if (!rows) continue;
            for(let j = Math.max(cellCol-1,0); j <= Math.min(cellCol+1,setting.cols-1); j++) {
                const cell = rows.cells[j]; 
                const mine = isMine(cell);
                if (cell && mine) {
                    mineCount++;
                }
            }
        }
        return mineCount;
    }

    function updateCellValue(cell, value) {
        const spanElement = document.createElement('span');
        spanElement.innerHTML = value;
        cell.innerHTML = '';
        cell.appendChild(spanElement);
    }

    function handleEmpty(cell) {
        updateCellValue(cell, ' ');
        let cellRow = cell.parentNode.rowIndex;
        let cellCol = cell.cellIndex;
        setStatus(cell, 'empty');
        //Reveal all adjacent cells as they do not have a mine
        for (let y = Math.max(cellRow-1,0); y <= Math.min(cellRow+1, setting.rows - 1); y++) {
            const rows = grid.rows[y];
            if (!rows) continue;
            for(let x = Math.max(cellCol-1,0); x <= Math.min(cellCol+1, setting.cols - 1); x++) {
                //Recursive Call
                const cell = rows.cells[x];
                if (cell && !isOpen(cell)) {
                    clickCell(cell);
                }
            }
        }
    }

    function openCell(cell) {
        if (grid.getAttribute('game-status') != 'active') return;

        cell.className="clicked";
        setStatus(cell, 'clicked');
        firstClick = false;

        if (isMine(cell)) {
            revealMines();
            flagsDisplay.innerHTML = '&#128561;';
            grid.setAttribute('game-status', 'over');
        } else {
            const mineCount = countMinesAround(cell);
            if (mineCount==0) { 
                handleEmpty(cell);
            } else {
                updateCellValue(cell, mineCount.toString());
                const dataValue = document.createAttribute('data-value');
                dataValue.value = mineCount;
                cell.setAttributeNode(dataValue);
            }
            //Count and display the number of adjacent mines
            checkLevelCompletion();
        }
    }
}
