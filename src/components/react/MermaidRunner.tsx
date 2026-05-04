import { useEffect } from 'react';

export function MermaidRunner() {
  useEffect(() => {
    void import('mermaid').then((mermaidMod) => {
      const mermaid = mermaidMod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#f9fafd',
          primaryTextColor: '#4c5157',
          primaryBorderColor: '#d2d5d6',
          lineColor: '#4c5157',
          secondaryColor: '#d2d5d6',
          tertiaryColor: '#f9fafd',
          mainBkg: '#ffffff',
          nodeBorder: '#d2d5d6',
          clusterBkg: '#f9fafd',
          titleColor: '#4c5157',
          edgeLabelBackground: '#ffffff',
          actorBorder: '#d2d5d6',
          actorBkg: '#f9fafd',
          signalColor: '#4c5157',
          signalTextColor: '#4c5157',
          labelBoxBkgColor: '#d33428',
          labelBoxBorderColor: '#d33428',
          labelTextColor: '#f9fafd',
          loopTextColor: '#4c5157',
          activationBorderColor: '#d33428',
          activationBkgColor: '#f9fafd',
          sequenceNumberColor: '#f9fafd',
        },
      });
      void mermaid.run({ querySelector: '.mermaid' });
    });
  }, []);

  return null;
}
