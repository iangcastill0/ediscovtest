import React from 'react';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { useBoolean } from '@uifabric/react-hooks';
import {
  TextField,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  ProgressIndicator,
} from '@fluentui/react';
import { addHoldItem } from '../../services/EdiscoveryService';
import { useGlobalState } from '../../state/globalState';

export const AddHoldDialog = ({ onDismiss }) => {
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(false);
  const [currentCase] = useGlobalState('currentCase');
  const [success, setSuccess] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [formDisabled, setFormDisabled] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleChange = (event, newValue) => {
    setInputValue(newValue);
  };

  const handleAdd = async () => {
    setInProgress(true);
    setFormDisabled(true);
    if(inputValue){
      await addHoldItem(currentCase, inputValue);
    }
    setInProgress(false);
    setSuccess(true);
    setTimeout(() => {
      setFormDisabled(false);
      onDismiss();
    }, 2000);
  };

  const handleDismiss = () => {
    toggleHideDialog();
    onDismiss();
  };

  const dialogContentProps = {
    type: DialogType.normal,
    title: 'Create new hold?',
    closeButtonAriaLabel: 'Close',
  };

  return (
    <>
      <Dialog
        hidden={hideDialog}
        onDismiss={handleDismiss}
        dialogContentProps={dialogContentProps}
        modalProps={{ isBlocking: true }}
      >
        <TextField 
          label="Name" 
          value={inputValue} 
          onChange={handleChange} 
          placeholder="Enter hold display name" 
        />
        <div style={{ paddingTop: '1em' }}>
          {success && <MessageBar messageBarType={MessageBarType.success}>The hold was created</MessageBar>}
          {inProgress && <ProgressIndicator description="Creating the hold..." />}
        </div>
        <DialogFooter>
          <PrimaryButton onClick={handleAdd} text="Add" disabled={formDisabled} />
          <DefaultButton onClick={handleDismiss} text="Cancel" disabled={formDisabled} />
        </DialogFooter>
      </Dialog>
    </>
  );
};
export default AddHoldDialog;