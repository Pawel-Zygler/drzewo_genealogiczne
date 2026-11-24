const AVATAR = 80;

export const avatarUrl = (p: { label: string; image?: string }) =>
  p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.label)}&background=random&color=fff&size=80`;

// The avatar is centred vertically in the node box, because that is where
// relatives-tree routes spouse and parent/child connectors.
function PersonNode({ data, height, photo }: { data: any; height: number; photo?: string }) {
  const role = data.role || 'Rodzina';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'Outfit, sans-serif',
      width: '100%',
      boxSizing: 'border-box',
      padding: `${height / 2 - AVATAR / 2}px 8px 0`,
      background: 'transparent',
      opacity: data.deceased ? 0.7 : 1,
      filter: data.deceased ? 'grayscale(100%)' : 'none',
    }}>
      
      {/* Avatar Circle */}
      <div style={{
        width: `${AVATAR}px`,
        height: `${AVATAR}px`,
        flexShrink: 0,
        boxSizing: 'border-box',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        border: data.isRoot || data.isSelected ? '3px solid #2563eb' : '3px solid white',
        boxShadow: data.isSelected ? '0 0 0 4px rgba(37, 99, 235, 0.45)' : data.isRoot ? '0 0 0 3px rgba(37, 99, 235, 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 1
      }}>
        <img 
          src={photo || avatarUrl(data)}
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
        lineHeight: '1.2',
        maxWidth: '100%',
        overflowWrap: 'anywhere',
        background: '#f8fafc',
        padding: '0 2px',
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '10px',
        color: '#6b7280',
        marginTop: '2px',
        textAlign: 'center',
        background: '#f8fafc',
        padding: '0 2px',
      }}>
        {role}
      </div>
    </div>
  );
}

export default PersonNode;
