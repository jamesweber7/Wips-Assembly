
class Wath {

    
    /*=============================================
    =                  Constants                  =
    =============================================*/    
    
    // Threshold for accuracy as an endpoint for most integrals
    static IntegrationInfinity = 2 ** 14;

    static HALF_SAFE_INTEGER = Math.floor(Number.MAX_SAFE_INTEGER * 0.5);

    // Most optimal dx for most common derivatives
    static ACCURATE_DX = 2 ** -24;

    // Good amount of steps to keep runtime ~50ms in my browser on my computer
    static STANDARD_INTEGRATION_STEPS = 2 ** 20;

    static standardNormalDistributions = [
        {
            z: -8,
            area: 0.00000000000000062209605
        },
        {
            z: -5,
            area: 0.00000028665157187919391
        },
        {
            z: -4,
            area: 0.00003167124183311992125
        },
        {
            z: -3,
            area: 0.00134989803163009452665
        },
        {
            z: -2,
            area: 0.02275013194817920720028
        },
        {
            z: -1,
            area: 0.1586552539314570514148
        },
        {
            z: -0.5,
            area: 0.3085375387259868963623
        },
        {
            z: -0.1,
            area: 0.4601721627229710185346
        },
        {
            z: 0,
            area: 0.5
        }
    ];

    /*=====  End of Constants  ======*/

    /*=============================================
    =                   Calculus                  =
    =============================================*/

    
    /*----------  Derivatives  ----------*/
    
    // f(x + Δx) - f(x - Δx)
    // ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
    //        2 Δx
    // more accurate than taking just the lefthand or righthand derivative
    static derivative(funct, x, dx=this.ACCURATE_DX) {
        return (funct(x + dx) - funct(x - dx))/(2*dx);
    }

    // f(x + Δx) - f(x)
    // ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
    //       Δx
    static rightDerivative(funct, x, dx=this.ACCURATE_DX) {
        let x2 = x + dx;

        let y = funct(x);
        let y2 = funct(x2);

        let dy = y2 - y;
        return dy / dx;
    }

    // f(x) - f(x - Δx)
    // ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
    //       Δx
    static leftDerivative(funct, x, dx=this.ACCURATE_DX) {
        return this.rightDerivative(funct, x - dx, dx);
    }

    static nthDerivative(funct, n, x, dx=this.ACCURATE_DX) {
        if (n > 1) {
            // f⁽ⁿ⁾(x)  n > 1
            return this.nthDerivative(funct, n-1, x, dx);
        }
        // f'(x)
        return this.derivative(funct, x, dx);
    }

    
    /*----------  Integration  ----------*/

    // integral:
    // ⌠ᵇ         
    // ⌡𝑓(𝑥)𝑑𝑥
    // ᵃ
    static integral(funct, a, b, steps=this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        a = Math.max(-this.IntegrationInfinity, a);
        b = Math.min( this.IntegrationInfinity, b);
        return this.midpointIntegral(funct, a, b, steps, minDx);
    }

    static midpointIntegral(funct, a, b, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        let dx = this.getStep(a, b, steps, minDx);
        return this.midpointRiemann(funct, a, b, dx);
    }

    static trapeziumIntegral(funct, a, b, steps=this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        a = Math.max(-this.IntegrationInfinity, a);
        b = Math.min( this.IntegrationInfinity, b);
        let dx = this.getStep(a, b, steps, minDx);
        return this.trapeziumApproximation(funct, a, b, dx);
    }

    // lefthand or righthand error
    // ϵ ≤ |error|
    // ϵ ≤ |R - L|*dx
    // ϵ ≤ |f(b) - f(a)|*dx
    static offhandRiemannError(funct, a, b, step=this.getStep(a, b)) {
        return Math.abs(funct(b) - funct(a)) * step;
    }

    // midpoint error
    // ϵ ≤ |error|
    // ϵ ≤ |R - L|*dx / 2
    // ϵ ≤ |f(b) - f(a)|*dx / 2
    static midpointRiemannError(funct, a, b, step=this.getStep(a, b)) {
        return Math.abs(funct(b) - funct(a)) * step / 2;
    }

    // get step size based on a, b, # of steps, and minDx
    static getStep(a, b, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        let dx = (b - a) / steps;
        return Math.max(dx, minDx);
    }

    // get # of steps based on a, b, minDx, and ratio from standard # of integration steps to steps
    static getSteps(a, b, ratio=1, minDx=this.ACCURATE_DX) {
        const range = b - a;
        let steps = this.STANDARD_INTEGRATION_STEPS / ratio;
        steps = Math.min(steps, range / steps);
        return Math.floor(steps);
    }

    // takes midpoint riemann regardless of endpoints
    static properIntegral(funct, a, b, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        let dx = this.getStep(a, b, steps, minDx);
        return this.midpointRiemann(funct, a, b, dx);
    }

    static isImproperIntegral(a, b) {
        return a <= -this.IntegrationInfinity || b >= this.IntegrationInfinity;
    }

    static improperIntegral(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        return this.nonUniformTrapeziumIntegral(funct, a, b, steps, minDx);
    }

    // take trapezium integral with step size varying based on change in change of funct : f⁽²⁾(x) = F⁽³⁾(x)
    // currently more accurate than a midpoint riemann when the range between endpoints is large, but 
    //      takes ~40x run-time - which means there's some error in my code or logic
    static nonUniformTrapeziumIntegral(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity, steps=this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {
        a = Math.max(a, -this.IntegrationInfinity);
        b = Math.min(b, this.IntegrationInfinity);

        const range = b - a;
        const NORMAL_STEP = range / steps;
        let current;

        // want to know when there is change in change
        // first, get change's total change
        let deriv = (x) => {
            return this.derivative(funct, x);
        }
        // get raw ugly manual map ∫ |f⁽²⁾(x)| (total change in f'(x))
        const STEP_TO_TEST_STEP_RATIO = 40;
        const TEST_STEP = NORMAL_STEP * STEP_TO_TEST_STEP_RATIO;
        let start = a + TEST_STEP * 0.5;
        current = deriv(start);
        // |Δy|
        let totalChange = 0;
        for (let x = start + TEST_STEP; x <= b; x += TEST_STEP) {
            let previous = current;
            current = deriv(x);
            totalChange += Math.abs(current - previous);
        }
        const AVERAGE_CHANGE = totalChange / range;

        // console.log('this is how much the function changed');
        // console.log(totalChange);
        // console.log('as opposed to non-absolute integral');
        // console.log(deriv(b) - deriv(a));
        // console.log('derivative: ', AVERAGE_CHANGE);

        const CHANGE_THRESHOLD = AVERAGE_CHANGE / steps;
        let area = 0;
        let step = getStep(a);
        current = getVal(a);
        for (let x = start + step; x <= b; x += step) {
            // add to area for current step
            let last = current;
            current = getVal(x);
            area += this.integralTrapezoid(step, last.y, current.y);

            // get step
            step = getStep(x);
        }

        return area;

        function getVal(x) {
            return {
                x: x,
                y: funct(x)
            };
        }
        function getStep(x) {
            const CHANGE_IN_CHANGE = Wath.nthDerivative(funct, 2, x);
            let step = NORMAL_STEP * AVERAGE_CHANGE / CHANGE_IN_CHANGE;
            step = Math.abs(step);
            step = Wath.constrain(step, minDx, TEST_STEP);
            return step;
        }

    }

    
    /*----------  Riemann Sums + Other Approximations  ----------*/

    //             n
    // ⌠ᵇ         ⎲
    // ⌡𝑓(𝑥)𝑑𝑥 ≈  ⎳ 𝒇(xᵢ₋₁)Δ𝑥ᵢ
    // ᵃ          i=1
    //           steps
    //            ⎲
    //         ≈  ⎳ 𝒇(b(i/n) + a(1-i/n))dx
    //            i=1
    static lefthandRiemann(funct, a, b, step) {
        return this.loopSum(a, b - step, (x) => {
            return funct(x) * step;
        }, step);
    }

    //             n
    // ⌠ᵇ         ⎲
    // ⌡𝑓(𝑥)𝑑𝑥 ≈  ⎳ 𝒇(xᵢ+xᵢ₋₁)Δ𝑥ᵢ
    // ᵃ          i=1
    //           steps
    //            ⎲
    //         ≈  ⎳ 𝒇(b(i/n) + a(1-i/n) + dx/2)dx
    //            i=1
    static midpointRiemann(funct, a, b, step) {
        let halfStep = step * 0.5;
        return this.loopSum(a + halfStep, b, (x) => {
            return funct(x) * step;
        }, step);
    }
    
    //             n
    // ⌠ᵇ         ⎲
    // ⌡𝑓(𝑥)𝑑𝑥 ≈  ⎳ ((𝒇(xᵢ₋₁)+f(xᵢ))/2)Δxᵢ
    // ᵃ          i=1
    //           steps
    //            ⎲
    //         ≈  ⎳ ((𝒇(b(i/n) + a(1-i/n))+𝒇(b(i/n) + a(1-i/n)+dx))/2)dx
    //            i=1
    static trapeziumApproximation(funct, a, b, step) {
        let area = 0;
        let y = funct(a);
        for (let x = a + step; x <= b; x += step) {
            let lastY = y;
            y = funct(x);
            area += this.integralTrapezoid(step, lastY, y);
        }
        return area;
    }
    
    // trapezoid of an integral taken using the trapezium rule
    static integralTrapezoid(step, y1, y2) {
        return step * (y1 + y2) / 2;
    }

    // UNFINISHED
    // keeps # of steps constant by mapping change to total change
    static nonUniformRiemannConstantSteps(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {

        // simplify endpoints with large bounds
        a = Math.max(-this.IntegrationInfinity, a);     // (∞, b]
        b = Math.min(this.IntegrationInfinity, b);      // [a, ∞)

        const range = b - a;

        const NORMAL_STEP = range / steps;

        // total change (∫ₐᵇ f'(x) dx)
        const TOTAL_CHANGE = funct(b) - funct(a);

        // return;
        // take integral, using variable weighted steps
        let step = minDx;
        let area = 0;
        for (let x = a; x < b; x += step) {
            // dy / dx
            let change = this.derivative(funct, x);
            // abs | dy / dx |
            let absChange = Math.abs(change);
            // absChange = Math.min(this.IntegrationInfinity, absChange);
            // // abs | dy |
            // changeValue = absChange * Wath.ACCURATE_DX;
            // | dx / dy |
            // let changeValue = 1 / absChange;
            // if (changeValue > TOTAL_CHANGE) {
            //     console.error('UH OH BIG CHANGE');
            //     console.error(x, changeValue);
            // }
            // step = this.map(changeValue, 0, TOTAL_CHANGE, 0, range);
            // dy / dx * (normal dx)
            // dy
            let dy = absChange * NORMAL_STEP;
            // 1 / dy
            step = 1 / dy;
            // dx ≤ step ≤ range
            step = this.constrain(step, minDx, range);
            // if (step <= 0) {
            //     console.error('UH OH BAD STEP');
            //     console.error(x, step);
            // }
            // step ≥ minDx
            // step = Math.max(step, minDx);
            area += funct(x) * step;
        }
        return area;
    }

    // broken and bad
    // riemann sum with step size inversely proportional to funct's derivative (second derivative of integral)
    static nonUniformRiemann(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity, steps = this.STANDARD_INTEGRATION_STEPS, minDx=this.ACCURATE_DX) {

        // simplify endpoints with large bounds
        a = Math.max(-this.IntegrationInfinity, a);     // (∞, b]
        b = Math.min(this.IntegrationInfinity, b);      // [a, ∞)

        const range = b - a;

        const NORMAL_STEP = range / steps;

        // take integral, using variable weighted steps
        let step = NORMAL_STEP;
        let area = 0;
        for (let x = a; x < b; x += step) {
            // dy / dx
            let change = this.derivative(funct, x);
            // abs | dy / dx |
            let absChange = Math.abs(change);
            // dx / dy
            let invChange = 1 / absChange;
            // (scale) * dx / dy
            let scaledDx = NORMAL_STEP * invChange;

            // dx ≤ step ≤ range
            step = this.constrain(dx, minDx, range);
            area += funct(x) * step;
        }
        return area;
    }

    // no epsilon cushion, finds exact constant or uses max # of calls
    // find inverse f⁻¹(target) within a and b
    // returns random match if f(x) = target for multiple x values between a and b
    static inverseFunct(funct, target=0, a=-this.IntegrationInfinity, b=this.IntegrationInfinity, closest=NaN, calls=2**10) {
        if (calls <= 0) {
            return closest;
        }

        // f(a)
        let fOfA = funct(a);
        // f(b)
        let fOfB = funct(b);
        
        let guess;
        // if target is between fOfA and fOfB
        if (this.between(target, fOfA, fOfB)) {
            guess = this.map(target, fOfA, fOfB, a, b);
        }
        // if target is not between fOfA and fOfB
        else {
            let range = b - a;
            let step = range / calls;
            guess = a + step;
        }

        let result = funct(guess);

        if (result === target) {
            return guess;
        }

        let epsilon = Math.abs(target - result);
        if (epsilon < funct(closest) || isNaN(closest)) {
            closest = guess;
        }

        // if f(guess) between [f(a), target]
        if (this.between(result, fOfA, target)) {
            b = guess;
        }
        // if target between [guess, b]
        else {
            a = guess;
        }
        return this.inverseFunct(funct, target, a, b, closest, calls - 1);
    }

    // ∫ |f'(x)|dx : total change f(x) undergoes
    // ∑|f(cₙ) - f(cₙ₋₁)| for all cₙ = critical value
    static totalChange(funct, a=-this.IntegrationInfinity, b=this.IntegrationInfinity, steps=this.getSteps(a, b, 100)) {
        // find all critical points
        throw 'gotta make this function';
    }

    /*=====  End of Calculus  ======*/


    /*=============================================
    =                Probability                  =
    =============================================*/


    static combination(n, r) {
        return this.permutation(n, r) / this.factorial(r);
    }

    static permutation(n, r) {
        return this.factorial(n) / this.factorial(n - r);
    }

    static factorial(n) {
        if (n > 0) {
            return n * this.factorial(n - 1);
        }
        if (n < 0 || !Number.isInteger(n)) {
            return null;
        }
        return 1;
    }

    static mean(values) {
        if (!Array.isArray(values)) {
            return this.mean([...arguments]);
        }   
        if (values.length <= 0) {
            return 0;
        } 
        let total = 0;
        values.forEach(value => {
            total += value;
        });
        return total / values.length;
    }

    /*----------  Discrete  ----------*/


    // binomial probability mass function :
    // 𝑷(𝑿=x) = ₙ𝑪ₓ∙pˣ∙(1-p)⁽¹⁻ˣ⁾ 
    // params: n=# of trials, p=𝑷(𝑿=x), x
    static binomialpmf(n, p, x) {
        return this.combination(n, x) * p ** x * (1 - p) ** (n - x);
    }

    // binomial cumulative mass function :
    // 𝑓(x) = 𝑷(𝑿≤x) = ∀𝑿≤x Σ ₙ𝑪ₓ∙pˣ∙(1-p)⁽¹⁻ˣ⁾ 
    // params: n=# of trials, p=𝑷(𝑿=x), x
    static binomialcmf(n, p, x) {
        if (x < 0) {
            return 0;
        }
        return this.binomialpmf(n, p, x) + this.binomialcmf(n, p, x - 1);
    }

    static binomialMean(a, b, p, step = 1) {
        let n = (b - a) / step;
        return n - p;
    }

    static binomialVariance(a, b, p, step = 1) {
        let n = (b - a) / step;
        return n * p * (1 - p);
    }

    static binomialDeviation(a, b, p, step = 1) {
        return this.binomialVariance(a, b, p, step) ** 0.5;
    }

    // poisson probability mass function :
    // 𝑷(𝑿=x) = ( (λ∙𝑻)ˣ∙e⁻⁽λ*𝑻⁾ ) /x!
    // params: λ=rate, x, T=units
    // OR params: λ*T, x
    static poissonpmf(lambda, x, T) {
        if (!T) {
            T = 1;
        }
        return (((lambda * T) ** x) * Math.E ** (- lambda * T)) / this.factorial(x);
    }

    // poisson cumulative mass function :
    // 𝑓(x) = 𝑷(𝑿≤x) = ∀𝑿≤x Σ ( (λ∙𝑻)ˣ∙e⁻⁽λ*𝑻⁾ ) /x!
    // params: λ=rate, x, 𝑻=units
    // OR params: λ*𝑻, x
    static poissoncmf(lambda, x, T) {
        if (x < 0) {
            return 0;
        }
        return this.poissonpmf(lambda, x, T) + this.poissoncmf(lambda, x - 1, T);
    }

    // create discrete probabilistic mean from arguments
    static discreteMean(probabilities) {
        if (!Array.isArray(probabilities)) {
            return this.discreteMean([...arguments]);
        }
        if (probabilities.length <= 0) {
            return 0;
        }
        let probability = probabilities.splice(0, 1)[0];
        return probability.x * probability.p + this.discreteMean(probabilities);
    }

    // calculate variance of arguments
    static discreteVariance(probabilities) {
        if (!Array.isArray(probabilities)) {
            probabilities = [...arguments];
        }
        if (!probabilities.length) {
            return 0;
        }
        let probability = probabilities.splice(0, 1)[0];
        return (probability.x ** 2 - probability.x) * probability.p + this.discreteVariance(probabilities);
    }

    // standard deviation :
    //              ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
    // σ = 𝑽(x)² = ⎷ ∀ₓΣ (x²-x)∙p(x)
    // params: probabilities
    static discreteDeviation(probabilities) {
        if (!Array.isArray(probabilities)) {
            probabilities = [...arguments];
        }
        return Math.sqrt(this.discreteVariance(probabilities));
    }

    static discreteUniformMean(a, b) {
        return (a + b) / 2;
    }

    static discreteUniformVariance(a, b, step = 1) {
        let n = (b - a) / step;
        return ((n * n - 1) / 12) * step;
    }

    static discreteUniformDeviation(a, b, step = 1) {
        return this.discreteUniformVariance(a, b, step) ** 0.5;
    }

    // create probability :
    // params: x, p(x)
    static createProbability(x, p) {
        return {
            x: x,
            p: p
        };
    }


    /*----------  Continuous  ----------*/



    // ⌠ᵇ  
    // ⌡ₐ x * f(x)𝑑𝑥
    static continuousMean(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity) {
        return this.integral((x) => {
            return x * funct(x);
        }, a, b);
    }

    // ⌠ᵇ               ⌠ᵇ
    // ⌡ₐ x² * f(x)𝑑𝑥 - ⌡ₐ x² * f(x)𝑑𝑥
    // V(x) = σ² = E(X²) - μ²
    static continuousVariance(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity) {
        // E(X²)
        let eXSq = this.integral((x) => {
            return x * x * funct(x);
        }, a, b);
        // E(X²) - μ²
        return eXSq - this.continuousMean(funct, a, b) ** 2;
    }

    // σ = √V(X)
    static continuousDeviation(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity) {
        return this.continuousVariance(funct, a, b) ** 0.5;
    }

    // continuous cumulative distribution function:
    // ⌠ᵇ
    // ⌡ₐ f(x)𝑑𝑥
    static continuouscdf(funct, a = -this.IntegrationInfinity, b = this.IntegrationInfinity) {
        return this.integral(funct, a, b);
    }

    // continuous uniform probability density function:
    // ∀c₁,c₂∈ X ∈ [a, b] (f(c₁) = f(c₂))
    // f(x) = 1 / (b - a)
    static continuousUniformpdf(a = -Infinity, b = Infinity) {
        return 1 / (b - a);
    }

    // continuous uniform cumulative density function:
    // ⌠ˣ   
    // ⌡ₐ f(x)𝑑𝑥
    // ⌠ˣ  __1__
    // = ⌡ₐ  b - a 𝑑𝑥
    //     __x__ ⎢ˣ 
    // =  b - a  ⎢ₐ 
    // = (x-a) / (b-a)
    static continuousUniformcdf(x, a = -Infinity, b = Infinity) {
        if (x < a) {
            return 0;
        }
        if (x > b) {
            return 1;
        }
        return (x - a) / (b - a);
    }

    // continuous uniform mean:
    // ⌠ᵇ  
    // ⌡ₐ x * f(x)𝑑𝑥
    // ⌠ᵇ __x__
    // = ⌡ₐ b - a 𝑑𝑥
    //     __x²___  ⎢ᵇ  
    // =  2(b-a)    ⎢ₐ
    // _b²_-_a²_
    // =  2(b-a)   
    // = (b + a) / 2
    static continuousUniformMean(a, b) {
        return (a + b) / 2;
    }

    // continuous uniform variance:
    // ⌠ᵇ               ⎧⌠ᵇ           ⎫²
    // ⌡ₐ x² * f(x)𝑑𝑥 - ⎩⌡ₐ x * f(x)𝑑𝑥⎭
    // = (b - a)² / 12
    static continuousUniformVariance(a, b) {
        return ((b - a) ** 2) / 12;
    }

    // continuous uniform deviation:
    // σ = √V(x)
    //   = (b - a) / √12
    static continuousUniformDeviation(a, b) {
        return (b - a) / 12 ** 0.5;
    }


    /*----------  Normal Distribution  ----------*/


    // normal probability density function:
    //             (-(x-μ)² / (2σ²))
    // N(μ, σ²) = e^
    //           ⎯⎯⎯⎯⎯
    //           √2πσ
    // more accurate to standardize then take pdf f(z) (normalpdf)
    static actualNormalpdf(x, mean, deviation) {
        // -(x-μ)²
        let exponentNumerator = -1 * (x - mean) ** 2;
        // 2σ²
        let exponentDenominator = 2 * deviation ** 2;
        // -(x-μ)² / (2σ²)
        let exponent = exponentNumerator / exponentDenominator;
        // e^(-(x-μ)² / (2σ²))
        let numerator = Math.E ** exponent;
        // √2πσ
        let denominator = (2 * Math.PI * deviation) ** 0.5;
        // ( e^(-(x-μ)² / (2σ²)) ) / √2πσ
        return numerator / denominator;
    }

    // normal cumulative density function:
    // ⌠ᵇ  
    // ⌡ₐ N(μ, σ²)𝑑𝑥
    // more accurate to standardize then take cdf Φ(z) (normalcdf)
    static actualNormalcdf(a = -Infinity, b = Infinity, mean, deviation) {

        // finite bounds
        // x ∈ [finite a, finite b]
        if (a > -this.IntegrationInfinity && b < this.IntegrationInfinity) {
            // cdf(a, b)
            return this.integral(x => {
                return this.actualNormalpdf(x, mean, deviation);
            }, a, b);
        }

        // infinite lower, finite upper
        // x ∈ (-∞, finite b]
        if (a < -this.IntegrationInfinity + 1 && b < this.IntegrationInfinity) {
            if (b > mean) {
                // cdf(-∞, μ) + cdf(μ, b)
                return 0.5 + this.actualNormalcdf(mean, b, mean, deviation);
            } else {
                // cdf(-∞, μ) - cdf(μ, b)
                return 0.5 - this.actualNormalcdf(b, mean, mean, deviation);
            }
        }

        // finite lower, infinite upper
        // x ∈ [finite a, ∞)
        if (a > -this.IntegrationInfinity && b > this.IntegrationInfinity - 1) {
            if (a > mean) {
                // cdf(-∞, μ) - cdf(μ, a)
                return 0.5 - this.actualNormalcdf(mean, a, mean, deviation);
            } else {
                // cdf(-∞, μ) + cdf(μ, a)
                return 0.5 + this.actualNormalcdf(a, mean, mean, deviation);
            }
        }

        // infinite bounds
        // x ∈ (-∞, ∞)
        return 1;
    }

    // standardize then take cdf Φ(z)
    static normalcdf(a = -Infinity, b = Infinity, mean = 0, deviation = 1) {
        return this.standardNormalcdf(this.standardizeNormal(a, mean, deviation), this.standardizeNormal(b, mean, deviation));
    }

    // standardize then take cdf f(z)
    static normalpdf(x, mean = 0, deviation = 1) {
        return this.standardNormalpdf(this.standardizeNormal(x, mean, deviation));
    }

    //          (-z² /2)
    //         e^
    // p(z) = ⎯⎯⎯
    //        √2π
    static standardNormalpdf(z) {
        // -z² /2
        let exponent = (-1 * z ** 2) / 2;
        // e^(-z² /2)
        let numerator = Math.E ** exponent;
        // √2π
        let denominator = (2 * Math.PI) ** 0.5;
        // e^(-z² /2) / √2π 
        return numerator / denominator;
    }

    // standard normal cumulative density function:
    //        ⌠ᵇ  
    // Φ(z) = ⌡ₐ p(z)𝑑z
    // more accurate to standardize then take cdf Φ(z) (normalcdf)
    static standardNormalcdf(a = -Infinity, b = Infinity) {
        // finite bounds
        // x ∈ [finite a, finite b]
        if (a > -this.IntegrationInfinity && b < this.IntegrationInfinity) {
            // cdf(a, b)
            return this.integral(x => {
                return this.standardNormalpdf(x);
            }, a, b);
        }

        // infinite lower, finite upper
        // x ∈ (-∞, finite b]
        if (a < -this.IntegrationInfinity + 1 && b < this.IntegrationInfinity) {
            if (b > 0) {
                // cdf(-∞, b) = cdf(-∞, 0) + cdf(0, b)
                return 0.5 + this.standardNormalcdf(0, b);
            } else {
                // cdf(-∞, b) = cdf(-∞, 0) - cdf(0, b)
                return 0.5 - this.standardNormalcdf(b, 0);
            }
        }

        // finite lower, infinite upper
        // x ∈ [finite a, ∞)
        if (a > -this.IntegrationInfinity && b > this.IntegrationInfinity - 1) {
            if (a > 0) {
                // cdf(-∞, a) = cdf(-∞, 0) - cdf(0, a)
                return 0.5 - this.standardNormalcdf(0, a);
            } else {
                // cdf(-∞, a) = cdf(-∞, 0) + cdf(0, a)
                return 0.5 + this.standardNormalcdf(a, 0);
            }
        }

        // infinite bounds
        // x ∈ (-∞, ∞)
        return 1;
    }

    // find x given F(x)
    static inverseNormal(area, mean = 0, deviation = 1) {
        let z = this.inverseStandardNormal(area);
        return this.unstandardizeNormal(z, mean, deviation);
    }

    // find z given Φ(z)
    static inverseStandardNormal(area) {
        if (area > 1) {
            return;
        }
        let total;
        let start, max;
        // area < 0.5
        for (let i = 1; i < this.standardNormalDistributions.length && !total; i++) {
            if (this.standardNormalDistributions[i].area > area) {
                max = this.standardNormalDistributions[i].z;
                start = this.standardNormalDistributions[i - 1].z;
                total = this.standardNormalDistributions[i - 1].area;
            }
        }
        // area > 0.5
        for (let i = 1; i < this.standardNormalDistributions.length && !total; i++) {
            if ((1 - this.standardNormalDistributions[i].area) < area) {
                max = - this.standardNormalDistributions[i - 1].z;
                start = -1 * this.standardNormalDistributions[i].z;
                total = 1 - this.standardNormalDistributions[i].area;
            }
        }
        // gap between [0.5 - ϵ, 0.5 + ϵ]
        if (Math.abs(0.5 - area) <= this.standardNormalDistributions[0].area) {
            max = -1 * this.standardNormalDistributions[this.standardNormalDistributions.length - 2].z;
            start = this.standardNormalDistributions[this.standardNormalDistributions.length - 2].z;
            total = this.standardNormalDistributions[this.standardNormalDistributions.length - 2].area;
        }
        // if x = 0 + ϵ or 1 - ϵ
        if (!total) {
            if (area > 0) {
                return Infinity;
            } else {
                return -Infinity;
            }
        }

        //            end
        //           ⌠      
        // integrate ⌡𝑓(𝑥)𝑑𝑥 ; check each step to see if z crossed
        //           start
        let steps = this.STANDARD_INTEGRATION_STEPS;
        let dx = Math.max((max - start) / steps, this.ACCURATE_DX);
        for (let z = start + dx * 0.5; z < max; z += dx) {
            total += this.standardNormalpdf(z) * dx;
            if (total > area) {
                return z - dx * 0.5;
            }
        }

    }

    // standardizing a normal random variable:
    // z = (x - μ) / σ
    static standardizeNormal(x, mean, deviation) {
        return (x - mean) / deviation;
    }

    // destandardizing a standard normal random variable:
    // x = (z × σ) + μ
    static unstandardizeNormal(z, mean, deviation) {
        return z * deviation + mean;
    }


    /*----------  Exponential  ----------*/


    // exponential probability mass function:
    //             -λx
    // f(x) = λ · e^
    static exponentialpdf(lambda, x) {
        return lambda * Math.E ** (- lambda * x);
    }

    // exponential cumulative distribution function:
    //             -λx
    // F(x) = 1 - e^
    static exponentialcdf(lambda, x) {
        return 1 - Math.E ** (- lambda * x)
    }

    // exponential mean:
    // μ = 1 / λ
    static exponentialMean(lambda) {
        return 1 / lambda;
    }

    // exponential variance:
    // V(x) = 1 / λ²
    static exponentialVariance(lambda) {
        return 1 / lambda ** 2;
    }

    // exponential deviation:
    // σ = 1 / λ
    static exponentialDeviation(lambda) {
        return 1 / lambda;
    }

    /*=====  End of     Probability        ======*/  



    
    /*=============================================
    =                  Statistics                 =
    =============================================*/
    // I just started the statistics part of my probability & statistics class, everything in this section will definitely be updated as I learn the ropes
    
    
    /*----------  Discrete  ----------*/
    
    // prob will need to rename, just the sum of all values / # of values
    //     ⎲
    // μ = ⎳ xᵢ ÷ N
    static discreteFairMean(values) {
        if (!Array.isArray(values)) {
            return this.discreteFairMean([...arguments]);
        }
        if (values.length <= 0) {
            throw "what's the mean of nothing?"
        }
        let total = this.arraySum(values);
        return total / values.length;
    }

    //     ⎲
    // μ = ⎳ xᵢ ÷ N
    static populationMean(population) {
        if (!Array.isArray(population)) {
            population = [...arguments];
        }
        return this.discreteFairMean(population);
    }

    //         N
    //      ⎛⎲        ⎞
    // σ² =  ⎳ (xᵢ-μ)²   ÷ N
    //     ⎝i=1        ⎠
    static populationVariance(population) {
        if (!Array.isArray(population)) {
            return this.populationVariance([...arguments]);
        }
        if (population.length <= 0) {
            throw "what's the variance of nothing?"
        }
        // μ
        let mean = this.populationMean(population);
        let total;
        population.forEach(value => {
            total += (value - mean)**2;
        });
        return total / population.length;
    }

    // σ = √σ²
    static populationDeviation(population) {
        if (!Array.isArray(population)) {
            population = [...arguments];
        }
        // σ = √σ²
        return this.populationVariance(population) ** 0.5;
    }

    // __  ⎲
    // X = ⎳ xᵢ ÷ n
    static sampleMean(samples) {
        if (!Array.isArray(samples)) {
            samples = [...arguments];
        }
        return this.discreteFairMean(samples);
    }

    
    //         n
    //      ⎛⎲     __ ⎞
    // s² =  ⎳ (xᵢ-X)²   ÷ (n - 1)
    //     ⎝i=1        ⎠
    static sampleVariance(samples) {
        if (!Array.isArray(samples)) {
            return this.discreteFairMean([...arguments]);
        }
        if (samples.length <= 0) {
            throw "what's the variance of nothing?"
        }
        // μ
        let mean = this.sampleMean(samples);
        let total = 0;
        samples.forEach(sample => {
            total += (sample - mean)**2;
        });
        return total / (samples.length - 1);
    }

    // s = √s²
    static sampleDeviation(samples) {
        if (!Array.isArray(samples)) {
            samples = [...arguments];
        }
        // s = √s²
        return this.sampleVariance(samples) ** 0.5;
    }



    
    /*=====  End of Statistics  ======*/
    
    
    




    
    /*=============================================
    =                    Misc                     =
    =============================================*/

    static isNumber(num) {
        return typeof num === 'number';
    }

    static absDifference(value1, value2) {
        return Math.abs(value1 - value2);
    }    
    
    /*----------  Random  ----------*/
    
    // random ∈ [0, bound) or [bound, bound2)
    static random(bound, bound2=NaN) {
        // if bound is upper bound, lower bound is 0
        if (isNaN(bound2)) {
            // return random ∈ [0, bound)
            return Math.random() * bound;
        }
        // if bound is lower bound, bound2 is upper bound

        // return random ∈ [bound, bound2)
        // return this.map(Math.random(), 0, 1, bound, bound2);
        return Math.random() * (bound2 - bound) + bound;
    }

    // return random int ∈ [0, bound] or [bound, bound2]
    static randomInt(bound, bound2=NaN) {
        return Math.floor(this.random(bound, bound2 + 1));
    }

    // broken
    // I know there are better shuffle algorithms, I was just thinking about different ways to shuffle an array or subset of that array, and thought it would be cool to get the index of a random enumerated permutation, and calculate the order based on that index in O(n). Little did I know enumeration of permutations and factorials is super complicated... still wanna try to figure this out though.
    static shuffle(arr) {
        throw 'this is broken';
        const length = arr.length;
        // number of ways array can be shuffled
        // permutations = length!
        const permutations = this.factorial(length);

        // selected permutation - selected order of array elements
        const selected = this.randomInt(0, permutations - 1);

        // permutation selected by its position in lexicographic arrangement
        // permutation 0            | 0, 1, 2, ... length-2, length-1
        // permutation 1            | 0, 1, 2, ... length-1, length-2
        // permutation length!-1    | length-1, length-2, ... 2, 1, 0

        const shuffled = Array(length);
        for (let i = 0; i < length; i++) {
            // section: group of consecutive equal vertical indexes (the same # can count for multiple sections if it is not consecutive)
            // let numSections = this.permutation(length, i + 1);
            // let sectionNum = Math.floor(permutations / numSections);
            let colStart = i;
            let arrIndex = (colStart + (selected + 1) ) % length
            shuffled[i] = arr[arrIndex];
        }
        return shuffled;

    }

    // O(n·n!)
    // working version of shuffle, but O(n·n!)
    // Michal Forišek https://www.quora.com/How-would-you-explain-an-algorithm-that-generates-permutations-using-lexicographic-ordering
    // Coding Train https://www.youtube.com/watch?v=goUlyp4rwiU
    static shufflePrototype(arr) {
        const length = arr.length;
        if (arr.length > 10) {
            throw "you're fixin to spend a lot of time waiting";
        }

        // number of ways array can be shuffled
        // permutations = length!
        const permutations = this.factorial(length);

        // selected permutation - selected order of array elements
        const selectedPermutation = this.randomInt(0, permutations - 1);

        // permutation selected by its position in lexicographic arrangement (by index)
        // permutation 0            | 0, 1, 2, ... length-2, length-1
        // permutation 1            | 0, 1, 2, ... length-1, length-2
        // permutation length!-1    | length-1, length-2, ... 2, 1, 0

        // [{0, arr[0]}, {1, arr[1]}, ... {length-1, arr[length-1]}]
        let shuffler = Wunctions.filledArray(length, 
            index => {
                return {
                    index: index,
                    value: arr[index]
                }
            });

        // each iteration reorders shuffled to nth permutation
        for (let n = 0; n < selectedPermutation; n++) {
            shuffler = this.lexicographicallyStepArray(shuffler);
        }

        const shuffled = Wunctions.filledArray(length, 
            index => {
                return shuffler[index].value;
            });
        return shuffled;
    }

    static lexicographicallyStepArray(arr) {
        const length = arr.length;
        // 1. Find the largest x such that P[x]<P[x+1].
        // (If there is no such x, P is the last permutation.)
        let largestI = -1;
        for (let i = 0; i < length - 1; i++) {
            if (arr[i].index < arr[i + 1].index) {
                largestI = i;
            }
        }
        // finished (arr is lexicographically reversed)
        if (largestI === -1) {
            console.log('finished');
            return arr;
        }

        // 2. Find the largest y such that P[x]<P[y].
        let largestJ = -1;
        for (let j = 0; j < length; j++) {
            if (arr[largestI].index < arr[j].index) {
                largestJ = j;
            }
        }


        // 3. Swap P[x] and P[y].
        arr = Wunctions.swapArrayElements(arr, largestI, largestJ);

        // 4. Reverse P[x+1 .. n].
        const end = arr.splice(largestI + 1);
        end.reverse();
        return arr.concat(end);
    }

    // just returns ceiling right now
    static logFactorial(n) {
        let log = 0;
        while (this.factorial(log) < n) {
            log++;
        }
        return log;
    }

    
    /*----------   ranges   ----------*/    

    static map(value, fromMin, fromMax, toMin, toMax) {
        return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
    }

    static constrain(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // note: order of a and b do not matter (not necessarily respective min and max)
    static between(value, a, b) {
        if (a < b) {
            return a < value && value < b;
        }
        // b < a
        return b < value && value < a;
    }

    
    /*----------  Sums  ----------*/
    
    //     end
    //     ⎲
    //     ⎳ 𝒇(x)
    // i=start
    // params: start, end, 𝒇(x)
    static sum(start, end, func, step = 1) {
        return this.loopSum(start, end, func, step = 1);
    }

    //     end
    //     ⎲
    //     ⎳ 𝒇(x)
    // i=start
    // params: start, end, 𝒇(x)
    // Sum using recursion
    static recursiveSum(start, end, func, step = 1) {
        if (start > end) {
            return 0;
        }
        return func(start) + this.sum(start + step, end, func, step);
    }

    //     end
    //     ⎲
    //     ⎳ 𝒇(x)
    // i=start
    // params: start, end, 𝒇(x)
    // Sum using loop (speed + no SO)
    static loopSum(start, end, func, step = 1) {
        let sum = 0;
        for (let i = start; i <= end; i += step) {
            sum += func(i);
        }
        return sum;
    }

    // forEach sum
    // arr.length - 1
    // ⎲
    // ⎳ arr[i]
    // i=0
    // Add each element in array
    static arraySum(arr) {
        let sum = 0;
        arr.forEach(value => {
            sum += value;
        });
        return sum;
    }

    // like Number.parseFloat, but allows for other based like Number.parseInt
    static parseFloat(numstring, base=10) {
        if (base === 10) {
            return Number.parseFloat(numstring);
        }

        let isNegative = false;
        // if includes negative sign
        if (numstring[0] === '-') {
            isNegative = true;
            numstring = numstring.substring(1);
        }

        let intstring, fracstring;
        // if float ∈ Q
        if (numstring.includes('.')) {
            // numstring = iiiii.fffff
            // integer part
            intstring = StringReader.substring(numstring, 0, '.');
            // fractional part
            fracstring = StringReader.substringBetween(numstring, '.')
        } else {
            // if float ∈ Z
            intstring = numstring;
            fracstring = '';
        }

        // reverse intstring so digit at i == digit*base**i
        intstring = StringReader.reverse(intstring);
        let float = 0;
        for (let i = 0; i < intstring.length; i++) {
            float += Number.parseInt(intstring[i], base)*(base**i);
        }
        
        for (let i = 0; i < fracstring.length; i++) {
            float += Number.parseInt(fracstring[i], base)*(base**(-1*(i+1)));
        }

        if (isNegative) {
            float *= -1;
        }
        return float;
    }
    
    /*=====  End of Misc  ======*/   

}