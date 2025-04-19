import React, { useState } from 'react';
export const NotesWidget: React.FC = () => {
  const [note, setNote] = useState('');
  return (
    <div style={{ padding: 16, minWidth: 180, minHeight: 120, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>📝 Sticky Notes</div>
      <textarea
        style={{ width: '100%', minHeight: 60, maxHeight: 'calc(100vh - 320px)', resize: 'vertical', borderRadius: 8, border: '1px solid #ccc', padding: 6, fontSize: 14, flex: 1 }}
        placeholder="Write a note..."
        value={note}
        onChange={e => setNote(e.target.value)}
      />
    </div>
  );
};
