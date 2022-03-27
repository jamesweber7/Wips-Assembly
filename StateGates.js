
// for state machines, I decided to go OO

class ClockTriggeredGate {
    constructor() {
        this._clk = '0';
    }
    // rising edge trigger
    isClockPulse(clk, pClk = this._clk) {
        if (LogicGate.bitToBool(
            LogicGate.and(
                LogicGate.not(pClk),
                clk
            )
        )) {
            return true;
        }
    }
    updateClockPulse(clk) {
        this._clk = clk;
    }
}

class ClockExclusiveGate extends ClockTriggeredGate {
    write(input) {
        if (!Array.isArray(input)) {
            input = [...arguments];
        }
        const clk = input.pop();
        const wires = input;
        if (this.isClockPulse(clk)) {
            this.updateWires(...wires)
        }
        this.updateClockPulse(clk);
    }
}

/*=============================================
=                  Flip Flops                 =
=============================================*/

class D_FlipFlop extends ClockTriggeredGate {

    constructor(numBits = 1) {
        super();
        this.q = LogicGate.empty(numBits);
        this.notq = LogicGate.not(this.q);
    }

    write(d, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            this.q = d;
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }

}

// D Flip Flop with async set & clr
class D_FlipFlopAsync extends D_FlipFlop {

    write(d, set, clr, clk) {
        // set
        if (LogicGate.bitToBool(set)) {
            this.q = '1';
            this.notq = '0';
            this.updateClockPulse();
        }
        // clr
        if (LogicGate.bitToBool(clr)) {
            this.q = '0';
            this.notq = '1';
            this.updateClockPulse(clk);
            return;
        }
        super.write(d, clk);
    }

}
class D_FlipFlopAsyncReset extends D_FlipFlop {
    write(d, clr, clk) {
        super.write(d, clk);
        this.q = LogicGate.bitstringAndBit(d, clr);
        this.notq = LogicGate.not(this.q);
    }
}

class S_R_FlipFlop extends ClockTriggeredGate {
    constructor() {
        super();
        this.q = '0';
        this.notq = '1';
    }

    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // Q⁺ = S+QR'
            this.q = LogicGate.mux(
                this.q, // no input
                '0',    // reset
                '1',    // set
                LogicGate.merge(
                    s, r
                )
            );
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }
}

class S_R_FlipFlopAsync {
    constructor() {
        this.q = '0';
        this.notq = '1';
    }

    write(s, r) {
        // Q⁺ = S+QR'
        this.q = LogicGate.mux(
            this.q, // no input
            '0',    // reset
            '1',    // set
            LogicGate.merge(
                s, r
            )
        );
        this.notq = LogicGate.not(this.q);
    }
}

class S_R_FlipFlopAsyncSet extends S_R_FlipFlop {
    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // update r sync
            this.q = LogicGate.and(
                this.q,
                LogicGate.not(r)
            )
        }
        // update s async
        this.q = LogicGate.or(
            this.q,
            s
        );
        this.notq = LogicGate.not(this.q);
        this.updateClockPulse(clk);
    }
}

class S_R_FlipFlopAsyncReset extends S_R_FlipFlop {
    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // update s sync
            this.q = LogicGate.or(
                this.q,
                s
            );
        }
        // update r async
        this.q = LogicGate.and(
            this.q,
            LogicGate.not(r)
        );
        this.notq = LogicGate.not(this.q);
        this.updateClockPulse(clk);
    }
}

class J_K_FlipFlop extends ClockTriggeredGate {
    constructor() {
        super();
        this.q = '0';
        this.notq = '1';
    }
    write(j, k, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // Q⁺ = Q'J + QK'
            this.q = LogicGate.or(
                LogicGate.and(
                    this.notq,
                    j
                ),
                LogicGate.and(
                    this.q,
                    LogicGate.not(k)
                )
            );
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }
}

/*=====  End of Flip Flops  ======*/

class FourBitRegister {
    constructor() {
        this.q = '0000';
        this._dFlipFlops = new Array(4);
        for (let i = 0; i < this._dFlipFlops.length; i++) {
            this._dFlipFlops[i] = new D_FlipFlopAsync();
        }
    }
    write(d, enable, reset, clk) {
        const fourBitMux = LogicGate.mux([this.q, d], enable);
        let qPlus = '';
        for (let i = 0; i < 4; i++) {
            const dFlipFlop = this._dFlipFlops[i];
            const set = '0';
            dFlipFlop.write(fourBitMux[i], set, reset, clk);
            qPlus += dFlipFlop.q;
        }
        this.q = qPlus;
    }
}

class BrainlessCPU {
    constructor() {
        // stored gates:
        this._accumulator = new FourBitRegister();
        // ram with 16 randomly filled 4-bit registers
        this._programRam = SingleReadRam.randomized(4, 16);
        // outputs:
        this.aluOut = '0000';
        this.accum = '0000';
        this.dataBus = '0000';
    }

    executeInstruction(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write) {
        // no clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '0');
        // clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '1');
        // no clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '0');
    }

    write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, clk) {

        this.readProgramRam(addrBus);

        this.updateMuxesToDataBus(dataIn, accToDb, read);

        this.updateAluOut(invert, arith, pass);

        this.updateAccumulator(loadAcc, reset, clk);

        this.updateMuxesToDataBus(dataIn, accToDb, read);

        this.updateProgramRam(addrBus, write, clk);

    }

    /*----------  Update Components  ----------*/
    updateMuxesToDataBus(dataIn, accToDb, read) {
        const dataMux = this.dataMux(dataIn, read);
        const accumMux = this.accumMux(dataMux, accToDb);
        this.dataBus = accumMux;
    }

    updateAccumulator(loadAcc, reset, clk) {
        this._accumulator.write(
            this.aluOut,
            loadAcc,
            reset,
            clk
        );
        this.accum = this._accumulator.q;
    }

    updateAluOut(invert, arith, pass) {
        const alu = this.alu(invert, arith, pass);
        this.aluOut = alu.y;
    }

    updateProgramRam(addrBus, write, clk) {
        this._programRam.write(
            addrBus,
            this.dataBus,
            write,
            clk
        );
    }

    /*----------  Components  ----------*/

    readProgramRam(addr) {
        this._programRam.read(addr);
    }

    alu(invert, arith, pass) {
        const aluCin = '0';
        return LogicGate.ALU16(
            this.dataBus,
            this.accum,
            aluCin,
            invert,
            arith,
            pass
        );
    }


    dataMux(dataIn, read) {
        return LogicGate.mux(
            dataIn,
            this._programRam.dataOut,
            read
        );
    }

    accumMux(dataMux, accToDb) {
        return LogicGate.mux(
            dataMux,
            this.accum,
            accToDb
        );
    }

}

class ParentRam extends ClockTriggeredGate {

    setData(data) {
        this._data = data;
    }

    getData() {
        return this._data;
    }

}

class Ram extends ParentRam {

    constructor(data) {
        super();
        this._data = data;
        this._size = data.length;
        this._regSize = data[0].length;
    }

    dataAt(addr) {
        return LogicGate.mux(this._data, addr);
    }

    reset(enable='1') {
        for (let i = 0; i < this._size; i++) {
            this._data[i] = LogicGate.bitstringAndBit(
                this._data[i],
                LogicGate.not(enable)
            );
        }
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

    // fills each register with the value of its index
    static indexValues(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(i),
                regLength
            );
        }
        return new this(data);
    }

}

// since using an array holding 16GiB (×16  - js char = 16 bits) of zeros on my irl computer
// creates data on access
class BigRam extends ParentRam {
    constructor(regLength) {
        super();
        this._data = [];
        this._regSize = regLength;
    }

    dataAt(addr) {
        if (this._data[addr] === undefined) {
            this._data[addr] = LogicGate.empty(this._regSize);
        }
        return this._data[addr];
    }

    setData(data) {
        this._data = data;
    }

    push(address, data) {
        this._data[address] = data;
    }

}

// RAM with only one read address
class SingleReadRam extends Ram {
    constructor(data) {
        super(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this._data[this._addr];
    }

    write(addr, dataIn, write, clk) {
        // addr updated async
        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this._data[
                    LogicGate.bitstringToDecimal(this._addr)
                ] = dataIn;
            }
        }
        this.dataOut = this.dataAt(this._addr);
        this.updateClockPulse(clk);
    }

    read(addr) {
        this._addr = addr;
        this.dataOut = this.dataAt(this._addr);
    }

    setData(data) {
        this._data = data;
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this.dataAt(this._addr);
    }

    setDataAt(data, addr) {
        this._data[addr] = data;
    }

}

class SingleReadBigRam extends BigRam {
    constructor(data) {
        super(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this._data[this._addr];
    }

    write(addr, dataIn, write, clk) {
        // addr updated async
        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this._data[this._addr] = dataIn;
            }
        }
        this.dataOut = this.dataAt(this._addr);
        this.updateClockPulse(clk);
    }

    read(addr) {
        this._addr = addr;
        this.dataOut = this.dataAt(this._addr);
    }

    setData(data) {
        super.setData(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this.dataAt(this._addr);
    }
}

class LatentRam extends SingleReadRam {
    write(addr, dataIn, write, clk) {
        if (this.isClockPulse(clk)) {
            this.dataOut = this.dataAt(this._addr);
            // addr updated sync after read
            this._addr = addr;
            if (LogicGate.bitToBool(write)) {
                this._data[
                    LogicGate.bitstringToDecimal(this._addr)
                ] = dataIn;
            }
        }
        this.updateClockPulse(clk);
    }
}
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
        this.readData1 = this.dataAt(this._addr1)
        this._addr2 = LogicGate.empty(5);
        this.readData2 = this.dataAt(this._addr2)
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
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.readData2 = this.dataAt(this._addr2);
        this.updateClockPulse(clk);
    }

    read(readReg1, readReg2) {
        this._addr1 = readReg1;
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.readData2 = this.dataAt(this._addr2);
    }

    setData(data) {
        super.setData(data);
        this._addr1 = LogicGate.empty(5);
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = LogicGate.empty(5);
        this.readData2 = this.dataAt(this._addr2);
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
        this.OvF = '0';
        this.sysin = '0';
        this.exit = '0';
        this.pipelineTrap = new S_R_FlipFlopAsyncReset();
        this.trap = LogicGate.or(
            this.OvF,
            this.exit,
            this.sysin
        );
    }

    updateWires(wires) {
        this.OvF = wires.OvF;
        this.sysin = LogicGate.and(
            wires.sysin,
            LogicGate.not(wires.receivedInput)
        );
        this.exit = wires.exit;
        this.trap = LogicGate.or(
            this.OvF,
            this.exit,
            this.sysin
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
            LogicGate.shiftRight(len, 2)
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

        this.readData1 = LogicGate.empty(32);
        this.readData2 = LogicGate.empty(32);
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

        this.readData1 = wires.readData1;
        this.readData2 = wires.readData2;
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
        this.branchPc = LogicGate.empty(32);

        this.branch = LogicGate.empty(1);
        this.bne = LogicGate.empty(1);
        this.jump = LogicGate.empty(1);
        this.jr = LogicGate.empty(1);

        this.regWrite = LogicGate.empty(1);
        this.zero = LogicGate.empty(1);

        this.memRead = LogicGate.empty(1);
        this.dataToReg = LogicGate.empty(2);
        this.memWrite = LogicGate.empty(1);

        this.aluResult = LogicGate.empty(32);
        this.writeData = LogicGate.empty(32);

        this.OvF = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.jAddr = wires.jAddr;

        this.pc = wires.pc;
        this.branchPc = wires.branchPc;

        this.branch = wires.branch;
        this.bne = wires.bne;
        this.jump = wires.jump;
        this.jr = wires.jr;

        this.regWrite = wires.regWrite;
        this.zero = wires.zero;

        this.memRead = wires.memRead;
        this.dataToReg = wires.dataToReg;
        this.memWrite = wires.memWrite;

        this.aluResult = wires.aluResult;
        this.writeData = wires.writeData;

        this.OvF = wires.OvF;
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

        this.aluResult = LogicGate.empty(32);
        this.readData = LogicGate.empty(32);

        this.OvF = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.pc = wires.pc;

        this.regWrite = wires.regWrite;
        this.dataToReg = wires.dataToReg;

        this.aluResult = wires.aluResult;
        this.readData = wires.readData;

        this.OvF = wires.OvF;
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

