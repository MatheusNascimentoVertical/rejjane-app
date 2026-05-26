export function BackgroundDecor() {
  return (
    <div className="rj-bg">
      <div className="splash splash-1" />
      <div className="splash splash-2" />
      <div className="splash splash-3" />
      <svg className="hearts-deco" viewBox="0 0 1200 800" preserveAspectRatio="none">
        {([[120,80,0.6],[1080,140,0.4],[200,720,0.5],[1050,640,0.55],[680,40,0.35]] as [number,number,number][]).map(([x,y,o],i) => (
          <path key={i} d={`M${x} ${y+8}c-3-8-15-12-15-22a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10-12 14-15 22z`} fill="#e91e63" opacity={o*0.18} />
        ))}
      </svg>
    </div>
  );
}
