import React from 'react';
import { ShieldCheck, Zap, Radio, Lock, Crown, Heart, ShieldAlert } from 'lucide-react';

export const AnimatedHeading = ({
  children,
  items,
  as: Component = 'h2',
  variant = 'shimmer',
  className = '',
  style = {},
  ...props
}) => {
  if (variant === 'marquee') {
    const list =
      items ||
      (typeof children === 'string' ? children.split('✦').map((s) => s.trim()) : [children]);
    const icons = [ShieldCheck, Zap, Radio, Lock, Crown, Heart, ShieldAlert];

    const renderMarqueeGroup = (keyPrefix) => (
      <span className="font-black text-rose tracking-wider flex items-center space-x-6">
        {list.map((item, idx) => {
          const IconComponent = icons[idx % icons.length];
          return (
            <React.Fragment key={`${keyPrefix}-${idx}`}>
              <span className="flex items-center space-x-2">
                <span>{item}</span>
              </span>
              <span className="inline-flex items-center justify-center space-x-2.5 px-3">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose/20 to-gold/20 border-2 border-rose/40 flex items-center justify-center shadow-md transform hover:scale-110 transition-transform">
                  <IconComponent className="w-5 h-5 text-rose stroke-[2.5px] drop-shadow-sm" />
                </span>
                <span className="w-2 h-2 rounded-full bg-tichi-success animate-ping"></span>
              </span>
            </React.Fragment>
          );
        })}
      </span>
    );

    return (
      <div
        className={`overflow-hidden whitespace-nowrap w-full py-2.5 ${className}`}
        style={style}
        {...props}
      >
        <div className="animate-marquee flex items-center space-x-8">
          {renderMarqueeGroup('g1')}
          {renderMarqueeGroup('g2')}
        </div>
      </div>
    );
  }

  return (
    <Component className={`font-black text-tichi-text ${className}`} style={style} {...props}>
      {children}
    </Component>
  );
};

export default AnimatedHeading;
