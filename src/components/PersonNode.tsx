import React from 'react';

function PersonNode({ data }: { data: any }) {
  const role = data.role || 'Rodzina';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'Outfit, sans-serif',
      width: '120px',
      background: 'transparent',
      opacity: data.deceased ? 0.7 : 1,
      filter: data.deceased ? 'grayscale(100%)' : 'none',
    }}>
      
      {/* Avatar Circle */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        border: data.isRoot ? '3px solid #2563eb' : '3px solid white',
        boxShadow: data.isRoot ? '0 0 0 3px rgba(37, 99, 235, 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        zIndex: 10
      }}>
        <img 
          src={data.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.label)}&background=random&color=fff&size=80`} 
          alt={data.label}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Name and Role */}
      <div style={{ 
        fontWeight: 800, 
        color: '#1f2937', 
        fontSize: '11px', 
        textTransform: 'uppercase', 
        textAlign: 'center',
        lineHeight: '1.2'
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '10px',
        color: '#6b7280',
        marginTop: '4px',
        textAlign: 'center'
      }}>
        {role}
      </div>
    </div>
  );
}

export default PersonNode;
