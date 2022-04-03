
/*
    Display only side of JavaScript-controlled ui - state changes should go through control.js
*/

/*----------  Data Declarations  ----------*/

const registerTable = document.getElementById('register-table');
const mainMemTable = document.getElementById('main-mem-table');
const mainMemBody = document.getElementById('main-mem-body');
const mainMemJumpSp = document.getElementById('main-mem-jump-sp');
const mainMemJumpStatic = document.getElementById('main-mem-jump-static');
const mainMemJumpPC = document.getElementById('main-mem-jump-pc');
const mainMemDisplayBinary = document.getElementById('main-mem-display-binary');
const mainMemDisplayAscii = document.getElementById('main-mem-display-ascii');
const trapTable = document.getElementById('trap-table');

const programTitle = document.getElementById('program-title');

const codeInput = document.getElementById('code-input');

const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const stepBtn = document.getElementById('step-btn');
const saveBtn = document.getElementById('save-btn');
const cyclesContainer = document.getElementById('cycles-container');
const numCyclesInput = document.getElementById('num-cycles-input');
const loadDropdown = document.getElementById('load-dropdown');
const loadDropdownOptions = document.getElementById('load-dropdown-options');
const importLoadBtn = document.getElementById('import-btn');
const hiddenImportFileInput = document.getElementById('import-file-hidden');
const errorOutput = document.getElementById('error-output');
const stateOutput = document.getElementById('state-output');
const spinner = document.getElementById('spinner');

const consoleIO = document.getElementById('console');
const clrConsoleBtn = document.getElementById('clear-console');

// states
const COMPILING = 'COMPILING', RUNNING = 'RUNNING';

// options
var PREMADE_PROGRAMS;
async function loadPremadePrograms() {
    const response = await fetch('programs.json');
    PREMADE_PROGRAMS = await response.json();
}
loadPremadePrograms().then(updatePremadeProgramUi);

// setup
createUi();
updateUi();

function createUi() {
    // give the user something to look at
    createTables();

    programTitle.onfocus = programTitle.select;
    // code input
    Wom.addTabFunctionality(codeInput);
    Wom.addLineSelectFunctionality(codeInput);
    codeInput.oninput = codeChanged;

    // console
    clrConsoleBtn.onclick = clearConsole;
    consoleIO.addEventListener('keydown', submitConsoleInputOnEnter);
    consoleIO.addEventListener('input', inputConsole);

    // button row
    Wom.yinYang(playBtn, pauseBtn);
    playBtn.addEventListener("click", userPlay);
    pauseBtn.addEventListener("click", userPause);

    stepBtn.onclick = userStep;
    stopBtn.onclick = userStop;
    saveBtn.onclick = userSave;
    cyclesContainer.onfocus = (e) => {
        e.stopPropagation();
        numCyclesInput.select();
    };
    numCyclesInput.addEventListener('input', updateNumCycles);
    controlNumCyclesInput(numCyclesInput);
    importLoadBtn.onclick = userImport;
    hiddenImportFileInput.onchange = readFileImport;

    mainMemBody.onscroll = scrollMainMem;
    mainMemJumpSp.onclick = setMainMemTableAtSp;
    mainMemJumpStatic.onclick = setMainMemTableAtStatic;
    mainMemJumpPC.onclick = setMainMemTableAtPC;
    mainMemDisplayAscii.onclick = displayMainMemTableAscii;
    mainMemDisplayBinary.onclick = displayMainMemTableBinary;
    Wom.yinYang(mainMemDisplayAscii, mainMemDisplayBinary);


    // shortcuts
    addShortcuts();

    printConsoleLogMessage();
}

function controlNumCyclesInput(numCyclesInput) {
    Wom.controlNumberInput(
        numCyclesInput,
        1,      // min val
        4999,   // max val
        1       // step size
    );
}

function updateNumCycles() {
    const value = this.value;
    getAllActiveCyclesInputs().forEach(input => {
        if (input.value !== value) {
            input.value = value;
        }
    })
}

function getAllActiveCyclesInputs() {
    return [...document.getElementsByClassName('num-cycles-input')];
}

function updateUi() {
    updateRegisterTable();
    updateMainMemoryTable();
    updateTrapTable();
    updateButtonRow();
}

function updateButtonRow() {
    updatePlayPauseButton();
}

function addShortcuts() {    
    document.addEventListener('keydown', (e) => {
        // doesn't matter if user is focused on input
        if (e.ctrlKey) {
            switch (e.key) {
                case 's':
                    userSave(e);
                    return;
                case 'o':
                    userLoad(e);
                    return;
                case 'ArrowRight':
                    userStep(e);
                    return;
                case ' ':
                    userPlayPause(e);
                    break;
                case 'c':
                    if (!Wom.hasSelection()) {
                        userStop(e);
                    }
                    return;
            }
        }
    })
}


/*----------  State Output  ----------*/

function showSpinner() {
    spinner.classList.remove('hidden');
}

function hideSpinner() {
    spinner.classList.add('hidden');
}

function setState(state) {
    const stateText = getStateText(state);
    if (stateOutput.innerText !== stateText) {
        stateOutput.innerText = stateText;
    }
    showSpinner();
}

function endState(state) {
    if (stateOutput.innerText === getStateText(state)) {
        stateOutput.innerText = '';
        hideSpinner();
    }
}

function setError(e) {
    const uncaughtPrefix = 'Uncaught ';
    const eString = e.toString().replace(uncaughtPrefix, '');
    errorOutput.innerText = eString;
}

function endError() {
    errorOutput.innerText = '';
}

function getStateText(state) {
    switch (state) {
        case COMPILING :
            return 'Compiling';
        case RUNNING :
            return 'Running';
    }
}


/*----------  User Input Actions  ----------*/
function userLoad(e) {
    e.preventDefault();
    loadDropdown.focus();
}

function userSave(e) {
    e.preventDefault();
    save();
}

function userPlayPause(e) {
    e.preventDefault();
    if (running) {
        userPause();
    } else {
        userPlay();
    }
}

function updatePlayPauseButton() {
    setTimeout(() => {
        Wom.onOff(playBtn, pauseBtn, !running)
    }, 10);
}

function userPlay() {
    start();
}

function userPause() {
    pause();
}

// E. stEp with an E.
function userStep(e) {
    e.preventDefault();
    singleStep();
}

// O. stOp with an O.
function userStop(e) {
    e.preventDefault();
    stopAndReset();
}

function userImport() {
    hiddenImportFileInput.click();
}

function readFileImport() {
    if (!this.files.length) {
        return;
    }
    const file = this.files[0];
    const fr=new FileReader();
    fr.onload = () => {
        setCodeInput(
            file.name,
            fr.result
        );
    }
    fr.readAsText(file);
}

/*----------  UI variables  ----------*/

function getCyclesPerRun() {
    return Number.parseInt(
        numCyclesInput.value
    );
}

function setCyclesPerRun(cycles) {
    numCyclesInput.value = cycles;
}

/*----------  console IO  ----------*/

function inputConsole() {
    protectConsoleInputOverwrite();
    protectConsoleInputLength();
    consoleIO.setAttribute("last", consoleIO.value);
}

// stop user from entering a longer string than is available to be input by syscall unit
function protectConsoleInputLength() {
    const data = consoleIO.getAttribute("data");
    const syscallUnitInputQueueLen = 32;
    const maxChars = syscallUnitInputQueueLen * 4 - 1;
    if (consoleIO.value.length > data.length + maxChars) {
        consoleIO.value = consoleIO.value.substring(0, data.length + maxChars);
    }
}

// stop user from editing immaleable console text
function protectConsoleInputOverwrite() {
    const data = consoleIO.getAttribute("data");
    // has overwrite?
    if (consoleIO.value.includes(data)) {
        // no overwrite
        return;
    }
    // overwrite
    // rollback
    consoleIO.value = consoleIO.getAttribute("last");
    consoleIO.selectionStart = consoleIO.value.length;
    consoleIO.selectionEnd = consoleIO.value.length;
}

function submitConsoleInputOnEnter(e) {
    if (e.key === 'Enter') {
        submitConsoleInput();
        saveConsoleInput(consoleIO.value + '\n');
    }
}

function submitConsoleInput() {
    let input = consoleIO.value;
    input = input.replace(consoleIO.getAttribute("data"), "");
    submitInput(input);
    saveConsoleInput(consoleIO.value);
}

function saveConsoleInput(value) {
    consoleIO.setAttribute("data", value);
    consoleIO.setAttribute("last", value);
}

function clearConsole() {
    saveConsoleInput('');
    consoleIO.value = '';
}

function outputInt(int) {
    outputToConsole(
        LogicGate.signedBitstringToDecimal(int)
    );
}

function outputString(fourByteString) {
    const split = LogicGate.split(fourByteString, 8, 8, 8, 8);
    const NUL_CHAR = '\x00';
    let out = '';
    let exit;
    for (let i = 0; i < split.length && !exit; i++) {
        let asciiByte = LogicGate.toAscii(split[i]);
        if (asciiByte === NUL_CHAR) {
            exit = true;
        } else {
            out += asciiByte;
        }
    }
    outputToConsole(out);
}

function outputToConsole(output) {
    saveConsoleInput(consoleIO.value);
    consoleIO.setAttribute(
        "data",
        consoleIO.getAttribute("data") + output
    );
    consoleIO.value = consoleIO.getAttribute("data");
    scrollConsole();
}

// if user scroll is at or near bottom and scroll height resizes, snap to bottom
function scrollConsole() {
    const maxSnap = 87; // size of 4 lines ( 4×\n )
    if (consoleIO.scrollTop + maxSnap >= consoleIO.scrollHeight - consoleIO.offsetHeight) {
        consoleIO.scrollTop = consoleIO.scrollHeight;
    }
}

/*----------  Tables  ----------*/

function createTables() {
    createRegisterTable();
    createMainMemoryTable();
    createTrapTable();
}

function updateTableRow(identifier, data) {
    const dataEl = document.getElementById(`${identifier}-data`);
    dataEl.innerText = data;
}

function createTableRow(identifier, title, data) {
    const tr = Wom.create('tr', `${identifier}-row`);

    const titleEl = Wom.createTo(tr, 'td', `${identifier}-title`);
    titleEl.innerText = title;

    const dataEl = Wom.createTo(tr, 'td', `${identifier}-data`);
    dataEl.innerText = data;
    
    return tr;
}

function getTableTitle(identifier) {
    return document.getElementById(`${identifier}-title`);
}

/*----------  Registers  ----------*/


function updateRegisterTable() {
    mips.registers().forEach((register, index) => {
        const regName = registers[index];
        updateRegisterRow(register, regName)
    });
}

function updateRegisterRow(register, regName) {
    updateTableRow(regName, register);
}

function createRegisterTable() {
    mips.registers().forEach((register, index) => {
        const regName = registers[index];
        createRegisterRow(register, regName);
    });
}

function createRegisterRow(register, regName) {
    const title = '$' + regName;
    const data = register;
    const tr = createTableRow(regName, title, data);
    registerTable.append(
        tr
    );
    const titleEl = getTableTitle(regName);
    titleEl.style = 'font-size: 18px;';
    tr.append(titleEl);
}


/*----------  Main Memory  ----------*/

function createMainMemoryTable() {
    const addr = '01111111111111111111111111111000'; // $sp - 4
    setMainMemTableAt(addr);
}

function updateMainMemoryTable() {
    const rows = getMainMemRows();
    rows.forEach(row => {
        const address = getRowAddress(row);
        updateTableRow(address, mainMemoryDataValueAt(address));
    })
}

function setMainMemTableAt(startAddr) {
    mainMemTable.innerText = '';
    let addr = startAddr;
    for (let i = 0; i < 12; i++) {
        if (addr[0] === '1') {
            addr = '00000000000000000000000000000000';
        }
        mainMemTable.append(
            createTableRow(addr, addr, mainMemoryDataValueAt(addr))
        );
        addr = LogicGate.bitstringToPrecision(
            LogicGate.toBitstring(
                LogicGate.bitstringToDecimal(addr) + 1
            ),
            32
        );
    }

    // scroll to middle
    mainMemBody.scrollTop = mainMemBody.scrollHeight - 1.5 * mainMemBody.offsetHeight;
}

function scrollMainMem(e) {
    e.stopPropagation();

    const rowOffsetHeight = getMainMemRows()[0].offsetHeight;
    const cushion = rowOffsetHeight;
    // at bottom
    if (mainMemBody.scrollTop > mainMemBody.scrollHeight - mainMemBody.offsetHeight - cushion) {
        updateMainMemBelow();
    }
    // at top
    else if (mainMemBody.scrollTop < cushion) {
        updateMainMemAbove();
        if (mainMemBody.scrollTop === 0) {
            mainMemBody.scrollTop += 4 * rowOffsetHeight;
        }
    }
}

function updateMainMemBelow() {
    let addr = mainMemRowAddressAtIndex(11);
    for (let i = 0; i < 4; i++) {
        addr = LogicGate.bitstringToDecimal(
            addr
        ) + 1;
        if (addr >= 2**31) {
            // OF - loop to first addr
            addr = '00000000000000000000000000000000';
        } else {
            addr = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    addr
                ),
                32
            );
        }
        getMainMemRows()[0].remove();
        mainMemTable.append(
            createTableRow(addr, addr, mainMemoryDataValueAt(addr))
        );
    }
}

function updateMainMemAbove() {
    let addr = mainMemRowAddressAtIndex(0);
    for (let i = 0; i < 4; i++) {
        addr = LogicGate.bitstringToDecimal(
            addr
        ) - 1;
        if (addr < 0) {
            // UF - loop to last addr
            addr = '01111111111111111111111111111111';
        } else {
            addr = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    addr
                ),
                32
            );
        }
        getMainMemRows()[11].remove();
        mainMemTable.prepend(
            createTableRow(addr, addr, mainMemoryDataValueAt(addr))
        );
    }
}

function mainMemoryDataValueAt(addr) {
    const dataType = mainMemTable.getAttribute('datatype');
    if (dataType === 'binary') {
        return mips.mainMemoryAt(addr);
    } else {
        const data = mips.mainMemoryAt(addr);
        // 8-bit
        if (data[0] === '1') {
            // replacement char
            return '�';
        }
        let text = LogicGate.toAscii(
            data
        );
        // NUL char
        if (text === '\x00') {
            return 'NUL';
        }
        if (text === '\n') {
            return '\\n';
        }
        return text;
    }
}

function firstMainMemAddress() {
    return mainMemRowAddressAtIndex(0);
}

function lastMainMemAddress() {
    return mainMemRowAddressAtIndex(11);
}

function mainMemRowAddressAtIndex(index) {
    const rows = getMainMemRows();
    if (rows[index] === undefined) {
        return LogicGate.toSignedBitstring(
            LogicGate.bitstringToDecimal(
                firstMainMemAddress()
            ) + index
        )
    }
    return getRowAddress(rows[index])
}

function getRowAddress(row) {
    return row.id.replace('-row', '');
}

function getMainMemRows() {
    return Wom.getArrayByTagName('tr', mainMemTable);
}

function setMainMemTableAtSp() {
    const spRegAddr = '11101';
    const sp = mips.getRegisterValue(spRegAddr);
    const start = LogicGate.addALU32(
        sp,
        '11111111111111111111111111111100' // -4
    );
    setMainMemTableAt(start);
}

function setMainMemTableAtStatic() {
    const staticMemAddress = '00010000000000000000000000000000';
    const start = LogicGate.addALU32(
        staticMemAddress,
        '11111111111111111111111111111100' // -4
    );
    setMainMemTableAt(start);
}

function setMainMemTableAtPC() {
    const pc = mips.getPc();
    const start = LogicGate.addALU32(
        pc,
        '11111111111111111111111111111100' // -4
    );
    setMainMemTableAt(start);
}

function displayMainMemTableAscii() {
    mainMemTable.setAttribute('datatype', 'ascii');
    updateMainMemoryTable();
}

function displayMainMemTableBinary() {
    mainMemTable.setAttribute('datatype', 'binary');
    updateMainMemoryTable();
}

/*----------  Trap  ----------*/

function createTrapTable() {
    const trap = mips.trap;
    let row;
    // Trap
    row = createTableRow('trap-trap', 'Tr', trap.Tr);
    row.title = 'Trap';
    trapTable.append(
        row
    );
    // Exit
    row = createTableRow('trap-exit', 'Exit', trap.Exit);
    row.title = 'Exit';
    trapTable.append(
        row
    );
    // Syscall
    row = createTableRow('trap-sysin', 'Sys', trap.Sys);
    row.title = 'Syscall';
    trapTable.append(
        row
    );
    // Overflow
    row = createTableRow('trap-of', 'Ov', trap.Ov);
    row.title = 'Overflow'
    trapTable.append(
        row
    );
    // Pipeline Trap
    row = createTableRow('trap-pipeline-trap', 'Pipeline Trap', trap.pipelineTrap.q);
    row.title = 'Pipeline Trap';
    trapTable.append(
        row
    );
}

function updateTrapTable() {
    const trap = mips.trap;
    updateTableRow('trap-trap', trap.Tr);
    updateTableRow('trap-exit', trap.Exit);
    updateTableRow('trap-sysin', trap.Sys);
    updateTableRow('trap-of', trap.Ov);
    updateTableRow('trap-pipeline-trap', trap.pipelineTrap.q);
}

// prompt user whether they want to continue
function promptContinue() {
    const popup = Wom.createPopup("Continue?", 'continue');
    const desc = Wom.createTo(popup, 'popupdesc');
    desc.innerText = `You have complete ${cycles} clock cycles. Do you wish to continue?`
    const yes = Wom.createTo(popup, 'button', 'continue-yes');
    const no = Wom.createTo(popup, 'button', 'continue-no');
    yes.innerText = 'Yes';
    no.innerText = 'No';
    const popupCyclesContainer = Wom.createTo(popup, 'cyclescontainer');
    popupCyclesContainer.innerText = 'Next prompt in:';
    const popupCyclesInput = Wom.createTo(popupCyclesContainer, 'input');
    controlNumCyclesInput(popupCyclesInput);
    popupCyclesInput.className = 'num-cycles-input';
    popupCyclesInput.value = getCyclesPerRun();
    popupCyclesInput.oninput = updateNumCycles;

    yes.onclick = () => {
        closePopup();
        start();
        updateUi();
    }

    no.onclick = () => {
        closePopup();
        endRun();
        updateUi();
    }

    function closePopup() {
        popup.remove();
    }
}


/*----------  Premade Programs  ----------*/

function updatePremadeProgramUi() {
    PREMADE_PROGRAMS.forEach(program => {
        const btn = Wom.createTo(loadDropdownOptions, 'button', `load-${program.title}`);
        if (program.optionName) {
            btn.innerText = program.optionName;
        } else {
            btn.innerText = program.title;
        }
        btn.onclick = () => {
            setCodeInput(program.title, program.text, program.cycles);
        }
        if (program.isNewProgram) {
            btn.addEventListener("click", addHeaderToCodeInput);
        }
        loadDropdownOptions.append(btn);
    });
    const BLANK_PROGRAM = PREMADE_PROGRAMS[0];
    setStartupProgram(BLANK_PROGRAM);
}

function setCodeInput(title, text, cycles=150) {
    codeChanged();
    stopAndReset();

    programTitle.value = title;
    codeInput.value = text;
    numCyclesInput.value = cycles;
}

function addHeaderToCodeInput() {
    // ######################
    // # Program Name       #
    // # Created mm/dd/yyyy #
    // ######################
    const programName = programTitle.value;
    const date = new Date();
    // mm/dd/yyyy
    const mm = Wunctions.numberToStringOfLength(
        date.getMonth() + 1, // gives index of month (0 = january)
        2
    );
    const dd = Wunctions.numberToStringOfLength(
        date.getDate(), 
        2
    );
    const yyyy = date.getFullYear();
    const createdDate = `${mm}/${dd}/${yyyy}`;
    const createdDateText = `Created ${createdDate}`;
    const lineOpen = '# ';
    const lineClose = ' #';
    const longerLen = Math.max(programName.length, createdDateText.length);
    const length = lineOpen.length + longerLen + lineClose.length;
    const hashtagRow = StringReader.mult('#', length);
    const nameLine = lineOpen + StringReader.bufferAfter(programName, ' ', longerLen) + lineClose;
    const dateLine = lineOpen + StringReader.bufferAfter(createdDateText, ' ', longerLen) + lineClose;
    const header = 
        hashtagRow + '\n' +
        nameLine + '\n' +
        dateLine + '\n' +
        hashtagRow + '\n\n';
    codeInput.value = header + codeInput.value;
}

function setStartupProgram(program) {
    setCodeInput(program.title, program.text, program.cycles);
    addWelcomeMessageToCodeInput();
}

function addWelcomeMessageToCodeInput() {
    // # Welcome!
    // # This is a MIPS computer simulator
    // # that uses JavaScript to manually process strings 
    // # of 1's and 0's the same way that a MIPS computer's 
    // # components process high and low wire signals. Hit
    // # the load button below to load a premade program, 
    // # or use this textarea to write a MIPS program 
    // # yourself.
    const msg = "Welcome!\nThis is a MIPS computer simulator that uses JavaScript to manually process strings of 1's and 0's the same way that a MIPS computer's components process high and low wire signals. Hit the load button below to load a premade program, or use this textarea to write a MIPS program yourself."
    let commentedMessage = commentFormatFactory(msg);
    codeInput.value = commentedMessage + '\n\n' + codeInput.value;
}

function commentFormatFactory(message) {
    const MAXLEN = 44;

    // break into newlines
    let brokenMsg = '';
    while(message.length) {
        while (/\s/.test(message[0])) {
            message = message.substring(1);
        }
        let parsing = message;
        if (parsing.includes('\n')) {
            parsing = StringReader.substringBefore(parsing, '\n');
        }
        if (parsing.length > MAXLEN) {
            parsing = parsing.substring(0, MAXLEN);
            if (parsing.includes(' ')) {
                parsing = StringReader.substringBeforeLast(parsing, /\s/);
            }
        }
        message = StringReader.substringAfter(message, parsing);
        brokenMsg += parsing;
        // if next line
        if (message) {
            brokenMsg += '\n';
        }
    }

    // add comment after each newline
    const LINE_START = '# ';
    const commentedMsg = LINE_START + brokenMsg.replaceAll('\n', '\n' + LINE_START);

    return commentedMsg;
}

function printConsoleLogMessage() {
    console.log("%cBrowser DevTools suck. %cSnooping's easier on GitHub: %chttps://github.com/jamesweber7", 
        "color: #09f; font-size: 30px;", 
        "color: red; font-size: 30px;", 
        "font-size: 18px;"
    );
}
