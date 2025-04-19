import React, { useState } from 'react';
export const NotesWidget: React.FC = () => {
  const [note, setNote] = useState('');
  return (
    <div style={{ padding: 16, minWidth: 180 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>📝 Sticky Notes</div>
      <textarea
        style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #ccc', padding: 6, fontSize: 14 }}
        placeholder="Write a note..."
        value={note}
        onChange={e => setNote(e.target.value)}
      />
    </div>
  );
};
