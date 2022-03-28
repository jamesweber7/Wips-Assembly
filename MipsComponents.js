
class MipsDataRam extends BigRam {
    constructor() {
        super(8);
        this._addr = LogicGate.empty(32);
        this.readData();
    }

    write(addr, dataIn, read, write, clk) {

        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this.writeData(dataIn);
            }
        }
        if (LogicGate.bitToBool(read)) {
            this.readData();
        }
        this.updateClockPulse(clk);
    }

    writeData(dataIn) {
        const bytes = LogicGate.split(dataIn, 8, 8, 8, 8);
        let addr = this._addr;
        this._data[addr] = bytes[3];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[2];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[1];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[0];
    }

    readData() {
        let addr = this._addr;
        this.dataOut1 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut2 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut3 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut4 = this.dataAt(addr);
    }
}

class MipsMainMemory extends BigRam {
    constructor() {
        super(8);
        this._dataAddr = LogicGate.empty(32);
        this.dataOut = this.wordAt(this._dataAddr);
        this._instructionAddr = LogicGate.empty(32);
        this.instructionOut = this.wordAt(this._instructionAddr);
    }

    writeData(addr, dataIn, read, write, clk) {
        this._dataAddr = addr;
        if (this.isClockPulse(clk)) {
            this.writeAt(dataIn, this._dataAddr, write);
        }
        if (LogicGate.bitToBool(read)) {
            this.dataOut = this.wordAt(this._dataAddr);
        }
        this.updateClockPulse(clk);
    }

    writeInstructions(pc, clk) {
        this._instructionAddr = pc;
        if (this.isClockPulse(clk)) {
            this.writeAt(pc, this._instructionAddr, '1');
        }
        this.instructionOut = this.wordAt(this._instructionAddr);
        this.updateClockPulse(clk);
    }

    wordAt(addr) {
        let word1 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        let word2 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        let word3 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        let word4 = this.dataAt(addr);
        return LogicGate.merge(word4, word3, word2, word1);
    }

    writeAt(dataIn, addr, write) {
        const bytes = LogicGate.split(dataIn, 8, 8, 8, 8);
        this._data[addr] = LogicGate.mux(
            this.dataAt(addr),
            bytes[3],
            write
        );
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = LogicGate.mux(
            this.dataAt(addr),
            bytes[2],
            write
        );        
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = LogicGate.mux(
            this.dataAt(addr),
            bytes[1],
            write
        );        
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = LogicGate.mux(
            this.dataAt(addr),
            bytes[0],
            write
        );    
    }

    push(address, data) {
        const bytes = LogicGate.split(data, 8, 8, 8, 8);
        super.push(address, bytes[3]);
        address = LogicGate.incrementer32(address);
        super.push(address, bytes[2]);
        address = LogicGate.incrementer32(address);
        super.push(address, bytes[1]);
        address = LogicGate.incrementer32(address);
        super.push(address, bytes[0]);
    }
}


class MipsRegisterRam extends Ram {
    constructor(data) {
        super(data);
        this._addr1 = LogicGate.empty(5);
        this.dataOut1 = this.dataAt(this._addr1)
        this._addr2 = LogicGate.empty(5);
        this.dataOut2 = this.dataAt(this._addr2)
    }

    write(readReg1, readReg2, writeReg, writeData, regWrite, clk) {
        // write updated first, then read
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(regWrite)) {
                this._data[
                    LogicGate.bitstringToDecimal(writeReg)
                ] = writeData;
            }
        }
        // read data updated async
        this._addr1 = readReg1;
        this.dataOut1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.dataOut2 = this.dataAt(this._addr2);
        this.updateClockPulse(clk);
    }

    read(readReg1, readReg2) {
        this._addr1 = readReg1;
        this.dataOut1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.dataOut2 = this.dataAt(this._addr2);
    }

    setData(data) {
        super.setData(data);
        this._addr1 = LogicGate.empty(5);
        this.dataOut1 = this.dataAt(this._addr1);
        this._addr2 = LogicGate.empty(5);
        this.dataOut2 = this.dataAt(this._addr2);
    }

    static randomized(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    Wath.randomInt(0, 2 ** regLength - 1)
                ),
                regLength
            );
        }
        return new this(data);
    }

    static empty(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.empty(regLength);
        }
        return new this(data);
    }
}


class MipsTrap extends ClockExclusiveGate {
    constructor() {
        super();
        // Overflow
        this.Ov = '0';
        // Sysin
        this.Sys = '0';
        // Exit
        this.Exit = '0';
        // Trap
        this.Tr = LogicGate.or(
            this.Ov,
            this.Exit,
            this.Sys
        );
        // pseudo-trap - does not trigger Tr
        this.pipelineTrap = new S_R_FlipFlopAsyncReset();
    }

    updateWires(wires) {
        // Overflow
        this.Ov = wires.Ov;
        // Sysin
        this.Sys = LogicGate.and(
            wires.sysin,
            LogicGate.not(wires.receivedInput)
        );
        // Exit
        this.Exit = wires.exit;
        // Trap
        this.Tr = LogicGate.or(
            this.Ov,
            this.Exit,
            this.Sys
        );
    }
}

class MipsSyscall extends ClockExclusiveGate {
    constructor() {
        super();
        this.syscall = '0';
        this.string = '0';
        this.stringStop = '0';
        this.exit = '0';
        this.sysin = '0';
        this.output = LogicGate.empty(32);
        this.receivedInput = '0';
        this.inputQueue = SingleReadRam.empty(32, 32);
        this.input = this.inputQueue.dataAt(
            LogicGate.empty(32)
        );
        this.pString = '0';
    }

    updateWires(output, opcode, len) {
        // syscallOp2
        const sysout = opcode[0];
        // syscallOp1
        const sysin = opcode[1];
        // syscallOp0
        const int = opcode[2];

        this.syscall = LogicGate.and(
            LogicGate.or(
                sysout,
                sysin
            ),
            LogicGate.not(this.stringStop)
        );
        this.exit = LogicGate.and(
            sysout,
            sysin
        );
        this.sysin = LogicGate.and(
            sysin,
            this.syscall,
            LogicGate.not(
                this.exit
            )
        );
        this.receivedInput = LogicGate.and(
            this.receivedInput,
            this.sysin
        );
        // reset input on nul char
        this.inputQueue.reset(this.stringStop);
        // len = '00000';
        this.input = this.inputQueue.dataAt(
            len
        );
        const bytesOut = LogicGate.split(output, 8, 8, 8, 8);
        const nulCharOut = LogicGate.or(
            LogicGate.zero(bytesOut[0]),
            LogicGate.zero(bytesOut[1]),
            LogicGate.zero(bytesOut[2]),
            LogicGate.zero(bytesOut[3])
        );
        const bytesIn = LogicGate.split(this.input, 8, 8, 8, 8);
        const nulCharIn = LogicGate.or(
            LogicGate.zero(bytesIn[0]),
            LogicGate.zero(bytesIn[1]),
            LogicGate.zero(bytesIn[2]),
            LogicGate.zero(bytesIn[3])
        );
        const nulStop = LogicGate.mux(
            nulCharOut,
            LogicGate.and(
                nulCharIn,
                this.receivedInput
            ),
            sysin
        );
        this.stringStop = LogicGate.and(
            this.string,
            nulStop
        );
        this.pString = this.string;
        this.string = LogicGate.and(
            this.syscall,
            LogicGate.not(
                int
            ),
            LogicGate.not(
                this.exit
            )
        );
        this.output = output;

    }

    inputData(input) {
        this.receivedInput = '1';
        for (let i = 0; i < input.length; i++) {
            this.inputQueue.setDataAt(input[i], i);
        }
    }
}

class MipsStaticMemoryPointer extends ClockExclusiveGate {

    STATIC_MEM_UPPER = '0001000000000000';
    constructor() {
        super();
        this._savedAddressLower = LogicGate.empty(16);
        this.address = this.STATIC_MEM_UPPER + this._savedAddressLower;
    }

    updateWires(writeAddr, memWrite) {
        const enable = memWrite;
        const splitWrite = LogicGate.split(writeAddr, 16, 16);
        const writeUpper = splitWrite[0];
        const writeLower = splitWrite[1];
        const currentLower = this._savedAddressLower;

        // writeAddr upper === static upper
        const isInStaticMem = LogicGate.eq(
            writeUpper,
            this.STATIC_MEM_UPPER
        );

        // writeAddr lower ≥ saved lower
        const isGreater = LogicGate.signedGeq(
            writeLower,
            currentLower
        );

        // writeAddr lower + 4
        const incrementedLower = LogicGate.addNoResize(
            writeLower,
            '0000000000000100'  // 4
        );

        const rewrite = LogicGate.and(
            enable,
            isInStaticMem,
            isGreater
        );

        this._savedAddressLower = LogicGate.mux(
            currentLower,
            incrementedLower,
            rewrite
        );
        this.address = this.STATIC_MEM_UPPER + this._savedAddressLower;
    }
}

class PipelineRegister extends ClockTriggeredGate {

    constructor() {
        super();
    }
    write(input) {
        if (!Array.isArray(input)) {
            input = [...arguments];
        }
        const clk = input.pop();
        const wires = input;
        if (this.isClockPulse(clk)) {
            this.updateWires(...wires);
        }
        this.updateClockPulse(clk);
    }
}

class InstrFetchToInstrDecodePipeline extends PipelineRegister {
    constructor() {
        super();
        this.pc = LogicGate.empty(32);
        this.instruction = LogicGate.empty(32);
    }
    updateWires(wires) {
        this.pc = wires.pc;
        this.instruction = wires.instruction;
    }
    flush(enable) {
        this.instruction = LogicGate.mux(
            this.instruction,
            LogicGate.empty(32), // nop
            enable
        );
    }
}

class InstrDecodeToAluExPipeline extends PipelineRegister {
    constructor() {
        super();
        this.jAddr = LogicGate.empty(32);
        this.pc = LogicGate.empty(32);
        this.regDst = LogicGate.empty(2);   // 2 bits

        this.branch = LogicGate.empty(1);
        this.bne = LogicGate.empty(1);
        this.jump = LogicGate.empty(1);
        this.jr = LogicGate.empty(1);

        this.memRead = LogicGate.empty(1);
        this.dataToReg = LogicGate.empty(2); // 2 bits
        this.memWrite = LogicGate.empty(1);

        this.aluSrc = LogicGate.empty(1);
        this.aluOp = LogicGate.empty(2);    // 2 bits

        this.regWrite = LogicGate.empty(1);

        this.regData1 = LogicGate.empty(32);
        this.regData2 = LogicGate.empty(32);

        this.immediate = LogicGate.empty(32);

        this.sl = LogicGate.empty(3);
        this.rs = LogicGate.empty(5);
        this.shamt = LogicGate.empty(5);
        this.syscallOp = LogicGate.empty(3);

        this.funct = LogicGate.empty(6);
        this.rt = LogicGate.empty(5);
        this.rd = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.jAddr = wires.jAddr,
        this.pc = wires.pc;
        this.regDst = wires.regDst;

        this.branch = wires.branch;
        this.bne = wires.bne;
        this.jump = wires.jump;
        this.jr = wires.jr;

        this.memRead = wires.memRead;
        this.dataToReg = wires.dataToReg;
        this.memWrite = wires.memWrite;

        this.aluSrc = wires.aluSrc;
        this.aluOp = wires.aluOp;

        this.regWrite = wires.regWrite;

        this.regData1 = wires.regData1;
        this.regData2 = wires.regData2;

        this.immediate = wires.immediate;

        this.sl = wires.sl;
        this.rs = wires.rs;
        this.shamt = wires.shamt;

        this.syscallOp = wires.syscallOp;

        this.funct = wires.funct;
        this.rt = wires.rt;
        this.rd = wires.rd;
    }
    flush(enable) {
        this.syscallOp = LogicGate.mux(
            this.syscallOp,
            LogicGate.empty(3),
            enable
        );
        this.regWrite = LogicGate.mux(
            this.regWrite,
            LogicGate.empty(1),
            enable
        );    
        this.memWrite = LogicGate.mux(
            this.memWrite,
            LogicGate.empty(1),
            enable
        );
        this.jump = LogicGate.mux(
            this.jump,
            LogicGate.empty(1),
            enable
        );
        this.jr = LogicGate.mux(
            this.jr,
            LogicGate.empty(1),
            enable
        );
        this.branch = LogicGate.mux(
            this.branch,
            LogicGate.empty(1),
            enable
        );
        this.bne = LogicGate.mux(
            this.bne,
            LogicGate.empty(1),
            enable
        );
    }
}

class AluExToMemPipeline extends PipelineRegister {
    constructor() {
        super();
        this.jAddr = LogicGate.empty(32);
        this.pc = LogicGate.empty(32);
        this.bAddr = LogicGate.empty(32);

        this.branch = LogicGate.empty(1);
        this.bne = LogicGate.empty(1);
        this.jump = LogicGate.empty(1);
        this.jr = LogicGate.empty(1);

        this.regWrite = LogicGate.empty(1);
        this.zero = LogicGate.empty(1);

        this.memRead = LogicGate.empty(1);
        this.dataToReg = LogicGate.empty(2);
        this.memWrite = LogicGate.empty(1);

        this.exeResult = LogicGate.empty(32);
        this.writeData = LogicGate.empty(32);

        this.Ov = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.jAddr = wires.jAddr;

        this.pc = wires.pc;
        this.bAddr = wires.bAddr;

        this.branch = wires.branch;
        this.bne = wires.bne;
        this.jump = wires.jump;
        this.jr = wires.jr;

        this.regWrite = wires.regWrite;
        this.zero = wires.zero;

        this.memRead = wires.memRead;
        this.dataToReg = wires.dataToReg;
        this.memWrite = wires.memWrite;

        this.exeResult = wires.exeResult;
        this.writeData = wires.writeData;

        this.Ov = wires.Ov;
        this.shifted = wires.shifted;
        this.syscallOp = wires.syscallOp;

        this.writeReg = wires.writeReg;
    }
}

class MemToWriteBackPipeline extends PipelineRegister {
    constructor() {
        super();
        this.pc = LogicGate.empty(32);

        this.regWrite = LogicGate.empty(1);
        this.dataToReg = LogicGate.empty(2);

        this.exeResult = LogicGate.empty(32);
        this.memData = LogicGate.empty(32);

        this.Ov = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.pc = wires.pc;

        this.regWrite = wires.regWrite;
        this.dataToReg = wires.dataToReg;

        this.exeResult = wires.exeResult;
        this.memData = wires.memData;

        this.Ov = wires.Ov;
        this.shifted = wires.shifted;
        this.syscallOp = wires.syscallOp;

        this.writeReg = wires.writeReg;
    }
}

class WriteBack {
    constructor() {
        this.stringin = LogicGate.empty(1);
        this.regWrite = LogicGate.empty(1);
        this.writeData = LogicGate.empty(32);
        this.writeReg = LogicGate.empty(5);
        this.len = LogicGate.empty(32);
        this.memIncrement = LogicGate.empty(32);
    }
    write(wires) {
        this.stringin = wires.stringin;
        this.regWrite = wires.regWrite;
        this.writeData = wires.writeData;
        this.writeReg = wires.writeReg;
        this.len = wires.len;
        this.memIncrement = wires.memIncrement;
    }
}

