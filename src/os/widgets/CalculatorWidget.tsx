import React, { useState } from 'react';

const BUTTONS = [
  ['7','8','9','/'],
  ['4','5','6','*'],
  ['1','2','3','-'],
  ['0','.','=','+'],
  ['DEL','C'] // DEL = delete last char, C = clear
];

function safeEval(expr: string): number|string {
  try {
    // eslint-disable-next-line no-eval
    return Function('return (' + expr + ')')();
  } catch {
    return 'Err';
  }
}

export const CalculatorWidget: React.FC = () => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string|number>('');

  function handleClick(val: string) {
    if (val === '=') {
      const res = safeEval(expr);
      setResult(res);
    } else if (val === 'C') {
      setExpr(''); setResult('');
    } else if (val === 'DEL') {
      setExpr(e => e.slice(0, -1));
    } else {
      setExpr(e => e + val);
    }
  }
  function handleClear() {
    setExpr(''); setResult('');
  }

  // Keyboard support
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setResult(safeEval(expr));
      } else if (e.key === 'Backspace') {
        setExpr(prev => prev.slice(0, -1));
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setExpr(''); setResult('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expr]);

  return (
    <div style={{ padding: 14, minWidth: 180, color: '#fff' }}>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#fff', textAlign: 'center', letterSpacing: 1 }}>
        🧮 Calculator
      </div>
      <div style={{ marginBottom: 6, background: '#232a39', borderRadius: 8, padding: 8, fontSize: 18, fontWeight: 600, minHeight: 32 }}>
        {result !== '' ? result : expr || '0'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 38px)', gap: 6 }}>
        {BUTTONS.flat().map((b, i) => (
          <button
            key={i}
            onClick={() => handleClick(b)}
            style={{ background: b === '=' ? '#8f5fff' : '#232a39', color: '#fff', border: '1px solid #8f5fff', borderRadius: 7, fontWeight: 600, fontSize: 17, padding: '6px 0', cursor: 'pointer', gridColumn: b === 'C' ? 'span 2' : undefined }}
          >{b === 'C' ? 'Clear' : b === 'DEL' ? 'Del' : b}</button>
        ))}
      </div>
    </div>
  );
};
