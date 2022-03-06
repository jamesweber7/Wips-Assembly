
// RangedVariable: 
// generates a random number within its range
// mostly used for testing
class RangedVariable {
    
    static FLOATING_POINT = 'floating point';

    constructor(min, max, roundTo=this.FLOATING_POINT) {
        this.min = min;
        this.max = max;
        this.roundTo = roundTo;
    }

    gen() {
        // no rounding
        if (this.isFloatingPoint()) {
            return Wath.random(this.min, this.max);
        }
        // round
        return Number.parseFloat(Wath.random(this.min, this.max).toFixed(this.roundTo));
    }

    isFloatingPoint() {
        return this.roundTo === this.FLOATING_POINT;
    }

}