import React from 'react';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { useBoolean } from '@uifabric/react-hooks';
import {
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  ProgressIndicator,
} from '@fluentui/react';
import { deleteCaseItem } from '../services/EdiscoveryService';

export const DeleteCaseDialog = ({ onDismiss, deleteId }) => {
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  const [formDisabled, setFormDisabled] = React.useState(false);

  const handleDelete = async () => {
    setInProgress(true);
    setFormDisabled(true);
    if(deleteId !== '' && deleteId){
      const result = await deleteCaseItem(deleteId);
      console.log('result:', result);
      if(result){
        setSuccess(false);
        setError(true);
        setErrorMsg(result);
      }else{
        setError(false);
        setSuccess(true);
      }
    }else{
      setSuccess(false);
      setError(true);
      console.log('else')
    }
    setInProgress(false);
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
    title: 'Delete This Case?',
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
        If you delete this case, all holds will be turned off. Any content that was on hold will be released, and data will be lost. Are you sure you want to delete this case?
        <div style={{ paddingTop: '1em' }}>
          {success && <MessageBar messageBarType={MessageBarType.success}>The case was deleted</MessageBar>}
          {error && <MessageBar messageBarType={MessageBarType.error}>{errorMsg}</MessageBar>}
          {inProgress && <ProgressIndicator description="Deleting the case..." />}
        </div>
        <DialogFooter>
          <PrimaryButton onClick={handleDelete} text="Delete" disabled={formDisabled} />
          <DefaultButton onClick={handleDismiss} text="Cancel" disabled={formDisabled} />
        </DialogFooter>
      </Dialog>
    </>
  );
};
export default DeleteCaseDialog;