import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';

declare const chrome: any;

interface Attempt {
    startTs:   number;
    endTs:     number;
    op:        'add' | 'sub' | 'mul' | 'div';
    digits:    [number, number];
    operands:  [number, number];        // already stored by logger
    timeLost:  number;
}

interface Session {
    startTs:  number;
    endTs:    number;
    attempts: Attempt[];
}


function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        chrome.storage.local.get({ sessions: [] }, (res: { sessions: Session[] }) =>
            setSessions(res.sessions)
        );
    }, []);

    if (sessions.length === 0) {
        return (
            <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
                <h1>Overall Overview</h1>
                <p>No completed sessions yet—finish a full run first!</p>
            </div>
        );
    }

    const attempts = sessions.flatMap(s => s.attempts);
    const totalProblems = attempts.length;
    const totalMs = attempts.reduce((s,a)=>s+(a.endTs-a.startTs),0);
    const avgSec  = (totalMs/totalProblems/1000).toFixed(2);

    const opTimes = (['add', 'sub', 'mul', 'div'] as const)
        .map(op => {
            const arr = attempts.filter(a => a.op === op);
            const avg = arr.reduce((s, a) => s + (a.endTs - a.startTs), 0) /
                        (arr.length || 1);
            return { op, avg };
        })
        .sort((a, b) => b.avg - a.avg);



    interface TimeBucket {
        op:         string;
        digits:     [number, number];
        minA:       number;
        maxA:       number;
        minB:       number;
        maxB:       number;
        totalTime:  number;
        count:      number;
        avgTime:    number;
    }
    const timeBuckets: Record<string, TimeBucket> = {};
    attempts.forEach(a => {
        const key = `${a.op}:${a.digits[0]}x${a.digits[1]}`;
        const dur = a.endTs - a.startTs;
        if (!timeBuckets[key]) {
            timeBuckets[key] = {
                op: a.op,
                digits: a.digits,
                minA: a.operands[0],
                maxA: a.operands[0],
                minB: a.operands[1],
                maxB: a.operands[1],
                totalTime: 0,
                count: 0,
                avgTime: 0
            };
        }
        const b = timeBuckets[key];
        b.totalTime += dur;
        b.count     += 1;
        // update value ranges
        b.minA = Math.min(b.minA, a.operands[0]);
        b.maxA = Math.max(b.maxA, a.operands[0]);
        b.minB = Math.min(b.minB, a.operands[1]);
        b.maxB = Math.max(b.maxB, a.operands[1]);
    });
    const bucketRates = Object.values(timeBuckets)
        .map(b => ({ ...b, avgTime: b.totalTime / b.count }))
        .sort((a, b) => b.avgTime - a.avgTime);


    return (
        <div style={{ padding:16,fontFamily:'sans-serif' }}>
            <h1>Overall Overview</h1>
            <p>Total problems solved (all sessions): {totalProblems}</p>
            <p>Average time per problem: {avgSec} s</p>


            <h2>Slowest Operations</h2>
            <ul>
              {opTimes.map(o => (
                <li key={o.op}>
                  {o.op.toUpperCase()}: {(o.avg / 1000).toFixed(3)} s/problem
                </li>
              ))}
            </ul>

            <h2>Most Time-Consuming Categories (by digits)</h2>
            <ul>
              {bucketRates.slice(0,5).map(b => (
                 <li key={`${b.op}-${b.digits[0]}x${b.digits[1]}`}>
                   {b.op.toUpperCase()} {b.digits[0]}×{b.digits[1]}: {(b.avgTime / 1000).toFixed(3)} s/problem
                 </li>
              ))}
            </ul>

            <h2>Drill Suggestions by Time-Heavy Categories</h2>
            <ul>
{bucketRates.slice(0,5).map(b => {
    const digitMin = (d: number) => Math.max(2, Math.pow(10, d - 1));
    const digitMax = (d: number) => Math.min(100, Math.pow(10, d) - 1);
    const clampDiv = (v: number) => Math.max(2, Math.min(12, v));  // divisors 2‑12
    const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

    const addSubRange = { minA: 2, maxA: 100, minB: 2, maxB: 100 };
    const mulDivRange = { minA: 2, maxA: 100, minB: 2, maxB: 100 };

    const [dA, dB] = b.digits;

    if (b.op === 'add') {
        addSubRange.minA = digitMin(dA);
        addSubRange.maxA = digitMax(dA);
        addSubRange.minB = digitMin(dB);
        addSubRange.maxB = digitMax(dB);
    }

    if (b.op === 'sub') {
        const minSub = digitMin(dB);
        const maxSub = digitMax(dB);

        const minResult = Math.pow(10, dA - 1);
        const maxResult = Math.pow(10, dA) - 1;

        let minAddend = minResult - maxSub; // smallest second addend
        let maxAddend = maxResult - minSub; // largest second addend

        minAddend = clamp(minAddend, 2, 100);
        maxAddend = clamp(maxAddend, 2, 100);
        if (minAddend > maxAddend) { minAddend = 2; maxAddend = 100; }

        addSubRange.minA = minSub;
        addSubRange.maxA = maxSub;
        addSubRange.minB = minAddend;
        addSubRange.maxB = maxAddend;
    }

    if (b.op === 'mul') {
        mulDivRange.minA = clampDiv(digitMin(dA));
        mulDivRange.maxA = clampDiv(digitMax(dA));
        mulDivRange.minB = digitMin(dB);
        mulDivRange.maxB = digitMax(dB);
    }

    if (b.op === 'div') {
        const minDiv = clampDiv(digitMin(dB));
        const maxDiv = clampDiv(digitMax(dB));

        const minDividend = Math.pow(10, dA - 1);      // 100 for 3‑digit
        const maxDividend = Math.pow(10, dA) - 1;      // 999

        const minQ = clamp(
            Math.ceil(minDividend / minDiv), 2, 100
        );
        const maxQ = clamp(
            Math.floor(maxDividend / maxDiv), 2, 100
        );
        if (minQ > maxQ) { mulDivRange.minA = 2; mulDivRange.maxA = 12;
                           mulDivRange.minB = 2; mulDivRange.maxB = 100; }
        else {
            mulDivRange.minA = minDiv;
            mulDivRange.maxA = maxDiv;
            mulDivRange.minB = minQ;
            mulDivRange.maxB = maxQ;
        }
    }

    return (
      <li key={`${b.op}-${dA}x${dB}`} style={{ marginBottom: '1rem' }}>
        <strong>
          {b.op.toUpperCase()} {dA}×{dB}: {(b.avgTime/1000).toFixed(3)} s/problem
        </strong>
        <br />
        ADD/SUB &nbsp;
        A: {addSubRange.minA}–{addSubRange.maxA},&nbsp;
        B: {addSubRange.minB}–{addSubRange.maxB}
        <br />
        MUL/DIV &nbsp;
        A: {mulDivRange.minA}–{mulDivRange.maxA},&nbsp;
        B: {mulDivRange.minB}–{mulDivRange.maxB}
      </li>
    );
})}
            </ul>
            <p style={{ fontSize: 12 }}>
              For each time-heavy category, set Zetamac’s “Range” boxes accordingly to focus on the slowest problem types.
            </p>
            { 
            // <h2>Suggested Drill Settings</h2>
            // <ul>
            //     {settings.map(s => (
            //         <li key={s.op}>
            //             <strong>{s.op.toUpperCase()}</strong><br/>
            //             A range: {s.minA} – {s.maxA}<br/>
            //             B range: {s.minB} – {s.maxB}
            //         </li>
            //     ))}
            // </ul>
            // {dominantOp && (
            //     <p style={{ fontSize: 12, color: 'crimson' }}>
            //         Tip: Your {dominantOp.toUpperCase()} problems show much higher
            //         corrections than the others. Consider un‑checking the other
            //         operations in Zetamac to focus exclusively on {dominantOp.toUpperCase()} for a session.
            //     </p>
            // )}
            // <p style={{ fontSize: 12 }}>
            //     Enter these number ranges in Zetamac’s “Range” boxes. Subtraction and
            //     Division automatically use the result of Addition/Multiplication with
            //     these same operand ranges, so one combined range per group is sufficient.
            // </p>
            }
        </div>
    );
}

const root = document.getElementById('root');
if(root) createRoot(root).render(<Dashboard />);