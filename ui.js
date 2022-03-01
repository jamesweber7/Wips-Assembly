
// data declarations
const registerTable = document.getElementById('register-table');
const registers = [
    'zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'
];

// setup
createRegisterTable();
updateUi();

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