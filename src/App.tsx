import { useEffect, useState } from 'react';

// allow using chrome API in TS
declare const chrome: any;

interface Attempt {
    prompt: string;
    op: 'add' | 'sub' | 'mul' | 'div';
    operands: [number, number];
    digits: [number, number];
    answer: string;
    keystrokes: {
        key: string;
        ts: number;
        delta: number;
        value: string;
    }[];
    numErrors: number;
    startTs: number;
    endTs: number;
}

interface Session {
    startTs: number;
    endTs: number;
    attempts: Attempt[];
}

export default function App() {
    const [sessions, setSessions] = useState<Session[]>([]);

    // load completed sessions
    useEffect(() => {
        chrome.storage.local.get({ sessions: [] }, (res: { sessions: Session[] }) => {
            setSessions(res.sessions);
        });
    }, []);

    // if no sessions, prompt user
    if (sessions.length === 0) {
        return (
            <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
                <h2>Session Summary</h2>
                <p>No completed sessions yet—solve a full run!</p>
            </div>
        );
    }

    // analyze latest session
    const latest = sessions[sessions.length - 1];
    const attempts = latest.attempts;

    // compute average time per problem (ms -> seconds)
    const times = attempts.map(a => a.endTs - a.startTs);
    const avgTimeMs = times.reduce((sum, t) => sum + t, 0) / times.length;
    const avgTimeSec = (avgTimeMs / 1000).toFixed(2);

    return (
        <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
            <h2>Session Summary</h2>
            <p>Problems solved: {attempts.length}</p>
            <p>Average time per problem: {avgTimeSec} seconds</p>

            <button
                style={{ marginTop: '1rem' }}
                onClick={() => chrome.runtime.openOptionsPage()}
            >
                Open Full Dashboard
            </button>
        </div>
    );
}
