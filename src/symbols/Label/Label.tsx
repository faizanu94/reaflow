import React, { FC } from 'react';
import classNames from 'classnames';
import css from './Label.module.css';

export interface LabelProps {
  x: number;
  y: number;
  height: number;
  width: number;
  text: string;
  style?: any;
  className?: string;
  originalText?: string;
}

export const Label: FC<Partial<LabelProps>> = ({
  text,
  x,
  y,
  style,
  className,
  originalText
}) => (
  <>
    <title>{originalText}</title>
    <g transform={`translate(${x}, ${y})`}>
      <text className={classNames(css.text, className)} style={style}>
        {text}
      </text>
    </g>
  </>
);
