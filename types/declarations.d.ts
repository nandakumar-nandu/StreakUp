declare module 'react-native-confetti-cannon' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface ConfettiCannonProps extends ViewProps {
    count: number;
    origin: { x: number; y: number };
    autoStart?: boolean;
    autoStartDelay?: number;
    colors?: string[];
    fallSpeed?: number;
    explosionSpeed?: number;
    fadeOut?: boolean;
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
  }

  export default class ConfettiCannon extends Component<ConfettiCannonProps> {
    start(): void;
    resume(): void;
    stop(): void;
  }
}
