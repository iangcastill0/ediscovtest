import React from 'react';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { Stack } from '@fluentui/react';

export const Loading = ({ message }) => {  // Destructuring 'message' from props
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
              <Spinner label={message || 'Loading...'} style={itemStyles} />
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
};
export default Loading;