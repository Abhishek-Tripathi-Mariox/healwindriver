/**
 * Lets TypeScript treat `import Foo from './foo.svg'` as a React component
 * (handled at runtime by react-native-svg-transformer).
 */
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
