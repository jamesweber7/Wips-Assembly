
// for state machines, I decided to go OO

class ClockTriggeredGate {
    constructor() {
        this._clk = '0';
    }
    // rising edge trigger
    isClockPulse(clk, pClk = this._clk) {
        return LogicGate.bitToBool(
                LogicGate.and(
                    LogicGate.not(pClk),
                    clk
                )
            );
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


/*=============================================
=                      RAM                    =
=============================================*/

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

/*=====  End of RAM  ======*/
