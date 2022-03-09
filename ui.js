

/*----------  Data Declarations  ----------*/

const registerTable = document.getElementById('register-table');
const mainMemTable = document.getElementById('main-mem-table');
const trapTable = document.getElementById('trap-table');

const programTitle = document.getElementById('program-title');

const compileBtn = document.getElementById('compile-btn');
const codeInput = document.getElementById('code-input');

// setup
createUi();
updateUi();

function createUi() {
    createTables();

    programTitle.onfocus = programTitle.select;
    Wom.addTabFunctionality(codeInput);
    // compile button
    compileBtn.onclick = () => {
        compileAndRun();
    }
}

function updateUi() {
    updateRegisterTable();
    updateMainMemoryTable();
    updateTrapTable();
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
        createTableRow('trap-exit', 'Exit', trap.sysin)
    );
    trapTable.append(
        createTableRow('trap-pipeline-trap', 'Pipeline Trap', trap.pipelineTrap)
    );
}

function updateTrapTable() {
    const trap = mips.trap;
    updateTableRow('trap-trap', trap.trap)
    updateTableRow('trap-of', trap.OvF);
    updateTableRow('trap-sysin', trap.sysin);
    updateTableRow('trap-exit', trap.sysin);
    updateTableRow('trap-pipeline-trap', trap.pipelineTrap);
}

