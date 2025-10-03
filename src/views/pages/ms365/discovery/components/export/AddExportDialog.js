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
import { addExportItem } from '../../services/EdiscoveryService';
import { useGlobalState } from '../../state/globalState';
import { useNavigate } from 'react-router-dom';

export const AddExportDialog = ({ onDismiss }) => {
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(false);
  const [currentCase] = useGlobalState('currentCase');
  const [review] = useGlobalState('review');
  const [success, setSuccess] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [formDisabled, setFormDisabled] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setInputValue(newValue);
  };

  const handleAdd = async () => {
    setInProgress(true);
    setFormDisabled(true);
    if(inputValue){
      await addExportItem(currentCase, review, inputValue);
    }
    setInProgress(false);
    setSuccess(true);
    setTimeout(() => {
      setFormDisabled(false);
      onDismiss();
      navigate(`/ms365/eDiscovery/reviewSet`);
    }, 2000);
  };

  const handleDismiss = () => {
    toggleHideDialog();
    onDismiss();
  };

  const dialogContentProps = {
    type: DialogType.normal,
    title: 'Add New Export?',
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
          placeholder="Enter export name" 
        />
        <div style={{ paddingTop: '1em' }}>
          {success && <MessageBar messageBarType={MessageBarType.success}>The export was added</MessageBar>}
          {inProgress && <ProgressIndicator description="Adding the export..." />}
        </div>
        <DialogFooter>
          <PrimaryButton onClick={handleAdd} text="Add" disabled={formDisabled} />
          <DefaultButton onClick={handleDismiss} text="Cancel" disabled={formDisabled} />
        </DialogFooter>
      </Dialog>
    </>
  );
};
export default AddExportDialog;