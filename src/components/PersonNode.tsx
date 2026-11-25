const AVATAR = 80;

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0d9488', '#4d7c0f', '#0369a1', '#9333ea', '#b45309', '#be123c'];

/** Initials on a coloured circle, drawn locally (no external image service, works offline and inside artifacts). */
export const avatarUrl = (p: { label: string; image?: string }) => {
  if (p.image) return p.image;
  const words = p.label.replace(/\(.*?\)/g, ' ').split(/\s+/).filter(w => /\p{L}/u.test(w));
  const initials = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
  let h = 0;
  for (const ch of p.label) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  const bg = AVATAR_COLORS[h % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="41" dominant-baseline="middle" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="30" font-weight="600" fill="#fff">${initials.replace(/[<>&"]/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

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
