import React from 'react';
import type { CalloutBlock } from '../../../types/blockTypes';
import { Info, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';

const CONFIG = {
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    cls: 'render-callout-info',
  },
  tip: {
    icon: <Lightbulb className="w-5 h-5 shrink-0" />,
    cls: 'render-callout-tip',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    cls: 'render-callout-warning',
  },
  fun: {
    icon: <Sparkles className="w-5 h-5 shrink-0" />,
    cls: 'render-callout-fun',
  },
};

export const CalloutRender: React.FC<{ block: CalloutBlock }> = ({ block }) => {
  const { icon, cls } = CONFIG[block.data.variant] || CONFIG.info;
  return (
    <div className={`render-callout ${cls}`}>
      <div className="render-callout-icon">{icon}</div>
      <p className="render-callout-text">{block.data.text}</p>
    </div>
  );
};
