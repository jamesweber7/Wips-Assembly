
// data declarations
const registerTable = document.getElementById('register-table');
const compileBtn = document.getElementById('compile-btn');
const codeInput = document.getElementById('code-input');

// setup
createUi();
updateUi();

function createUi() {
    createRegisterTable();
    Wom.addTabFunctionality(codeInput);
    // compile button
    compileBtn.onclick = () => {
        compileAndRun();
    }
}

function updateUi() {
    updateRegisterList();
}

function updateRegisterList() {
    mips.registers().forEach((register, index) => {
        updateRow(register, index)
    });
}

function updateRow(register, index) {
    const regName = registers[index];
    const regData = document.getElementById(`${regName}-data`);
    regData.innerText = register;
}

function createRegisterTable() {
    const registerTable = document.getElementById('register-table');
    mips.registers().forEach((register, index) => {
        registerTable.append(
            newRegisterRow(register, index)
        );
    });
}

function newRegisterRow(register, index) {
    const regName = registers[index];
    const tr = document.createElement('tr');
    tr.id = `${registers[index]}-reg`;
    const data = Wom.createTo(tr, 'td', `${regName}-data`);
    data.innerText = register;
    const title = Wom.createTo(tr, 'td', `${regName}-title`);
    title.style = 'font-size: 18px;';
    title.innerText = '$' + regName;
    return tr;
}
