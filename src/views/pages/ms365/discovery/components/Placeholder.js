import { DefaultPalette, FontIcon, mergeStyles, Stack, Label } from '@fluentui/react';
import React from 'react';

export const Placeholder = ({ icon, text }) => { // Destructuring 'icon' and 'text' from props
  const iconClass = mergeStyles({
    fontSize: 100,
    color: DefaultPalette.neutralTertiaryAlt,
  });

  const textClass = mergeStyles({
    fontSize: 20,
    color: DefaultPalette.neutralTertiaryAlt,
  });

  const stackStyles = {
    root: {},
  };
  const itemStyles = {
    alignItems: 'center',
    justifyContent: 'center',
  };
  const stackTokens = { childrenGap: 5 };

  return (
    <div id="outer">
      <div id="table-container">
        <div id="table-cell">
          <Stack tokens={stackTokens}>
            <Stack horizontalAlign="center" styles={stackStyles}>
              <Label className={textClass}>{text}</Label>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
};
export default Placeholder;