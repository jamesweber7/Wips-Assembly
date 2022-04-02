
// The schematics for this were made and simulated in the Digital logic gate simulator for a class (CSE120 @ ASU). I remade them here in JavaScript before deciding to tackle the MIPS cpu

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
