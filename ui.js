

/*----------  Data Declarations  ----------*/

const registerTable = document.getElementById('register-table');
const mainMemTable = document.getElementById('main-mem-table');
const trapTable = document.getElementById('trap-table');

const programTitle = document.getElementById('program-title');

const codeInput = document.getElementById('code-input');

const compileBtn = document.getElementById('compile-btn');
const stopBtn = document.getElementById('stop-btn');
const stepBtn = document.getElementById('step-btn');
const cyclesContainer = document.getElementById('cycles-container');
const numCyclesInput = document.getElementById('num-cycles-input');

const consoleIO = document.getElementById('console');

const loadDropdownOptions = document.getElementById('load-dropdown-options');


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
    createTables();

    programTitle.onfocus = programTitle.select;
    // code input
    Wom.addTabFunctionality(codeInput);
    Wom.addLineSelectFunctionality(codeInput);
    codeInput.onchange = () => {
        compiled = false;
        saved = false;
    }
    Wom.addAutoResize(codeInput);

    // console
    consoleIO.addEventListener('input', inputConsole);
    consoleIO.addEventListener('keypress', submitConsoleInput);

    // button row
    compileBtn.onclick = compileAndRun;
    stepBtn.onclick = singleStep;
    stopBtn.onclick = stopPipeline;
    cyclesContainer.onfocus = (e) => {
        e.stopPropagation();
        numCyclesInput.select();
    };
}

function updateUi() {
    updateRegisterTable();
    updateMainMemoryTable();
    updateTrapTable();
}


/*----------  UI variables  ----------*/

function getCyclesPerRun() {
    return Number.parseInt(
        numCyclesInput.value
    );
}

/*----------  console IO  ----------*/

function inputConsole() {
    if (!consoleIO.value.includes(consoleIO.getAttribute("data"))) {
        let selectionStart = consoleIO.selectionStart;
        let selectionEnd = consoleIO.selectionEnd;
        consoleIO.value = consoleIO.getAttribute("last");
        consoleIO.selectionStart = selectionStart + 1;
        consoleIO.selectionEnd = selectionEnd + 1;
    }
    consoleIO.setAttribute("last", consoleIO.value);
}

function submitConsoleInput(e) {
    if (e.key === 'Enter') {
        let input = consoleIO.value;
        input = input.replace(consoleIO.getAttribute("data"), "");
        submitInput(input);
        consoleIO.setAttribute("data", consoleIO.value + '\n');
    }
}

function outputInt(int) {
    outputToConsole(
        LogicGate.signedBitstringToDecimal(int)
    );
}

function outputString(fourByteString) {
    const split = LogicGate.split(fourByteString, 8, 8, 8, 8);
    outputToConsole(
        LogicGate.toAscii(split[0]) +
        LogicGate.toAscii(split[1]) +
        LogicGate.toAscii(split[2]) +
        LogicGate.toAscii(split[3])
    );
}

function outputToConsole(output) {
    consoleIO.setAttribute(
        "data",
        consoleIO.getAttribute("data") + output
    );
    consoleIO.value = consoleIO.getAttribute("data");
}

function uiInput(input) {
    input = input + '\n';
    consoleIO.setAttribute(
        "data",
        consoleIO.getAttribute("data") + input
    );
    consoleIO.value = consoleIO.getAttribute("data");
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
    const stack = mips.stackAtPointer();
    const addr1 = stack.stackPointer;
    const addr2 = LogicGate.incrementer32(addr1);
    const addr3 = LogicGate.incrementer32(addr2);
    const addr4 = LogicGate.incrementer32(addr3);

    mainMemTable.append(
        createTableRow('data4', '$sp+3', stack.dataOut4)
    );
    mainMemTable.append(
        createTableRow('data3', '$sp+2', stack.dataOut3)
    );
    mainMemTable.append(
        createTableRow('data2', '$sp+1', stack.dataOut2)
    );
    mainMemTable.append(
        createTableRow('data1', '$sp+0', stack.dataOut1)
    );
}

function updateMainMemoryTable() {
    const stack = mips.stackAtPointer();
    const addr1 = stack.stackPointer;
    const addr2 = LogicGate.incrementer32(addr1);
    const addr3 = LogicGate.incrementer32(addr2);
    const addr4 = LogicGate.incrementer32(addr3);

    updateTableRow('data4', stack.dataOut4);
    updateTableRow('data3', stack.dataOut3);
    updateTableRow('data2', stack.dataOut2);
    updateTableRow('data1', stack.dataOut1);
}


/*----------  Trap  ----------*/

function createTrapTable() {
    const trap = mips.trap;
    trapTable.append(
        createTableRow('trap-trap', 'Trap', trap.trap)
    );
    trapTable.append(
        createTableRow('trap-of', 'Overflow', trap.OvF)
    );
    trapTable.append(
        createTableRow('trap-sysin', 'Sysin', trap.sysin)
    );
    trapTable.append(
        createTableRow('trap-exit', 'Exit', trap.exit)
    );
    trapTable.append(
        createTableRow('trap-pipeline-trap', 'Pipeline Trap', trap.pipelineTrap.q)
    );
}

function updateTrapTable() {
    const trap = mips.trap;
    updateTableRow('trap-trap', trap.trap);
    updateTableRow('trap-of', trap.OvF);
    updateTableRow('trap-sysin', trap.sysin);
    updateTableRow('trap-exit', trap.exit);
    updateTableRow('trap-pipeline-trap', trap.pipelineTrap.q);
}

// prompt user whether they want to continue
function promptContinue() {
    const popup = Wom.createPopup("Continue?");
    const yes = Wom.createTo(popup, 'button', 'continue-yes');
    const no = Wom.createTo(popup, 'button', 'continue-no');
    yes.innerText = 'Yes';
    no.innerText = 'No';

    yes.onclick = () => {
        closePopup();
        retreiveFreshCyclesAndRun();
    }

    no.onclick = closePopup;

    function closePopup() {
        popup.remove();
    }
}


/*----------  Premade Programs  ----------*/

function updatePremadeProgramUi() {
    PREMADE_PROGRAMS.forEach(program => {
        const btn = Wom.createTo(loadDropdownOptions, 'button', `load-${program.title}`);
        btn.innerText = program.title;
        btn.onclick = () => {
            setCodeInput(program.title, program.text, program.cycles);
        }
        loadDropdownOptions.append(btn);
    });
    const BLANK_PROGRAM = PREMADE_PROGRAMS[1];
    setCodeInput(BLANK_PROGRAM.title, BLANK_PROGRAM.text, BLANK_PROGRAM.cycles);
}

function setCodeInput(title, text, cycles) {
    programTitle.value = title;
    codeInput.value = text;
    codeInput.dispatchEvent(new Event('input'));
    if (cycles) {
        numCyclesInput.value = cycles;
    }
}