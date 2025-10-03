import React from 'react';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { useBoolean } from '@uifabric/react-hooks';
import {
  ComboBox,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  ProgressIndicator,
} from '@fluentui/react';
import { addTodoItem, getTaskLists } from '../services/TasksService';
import { useGlobalState } from '../state/globalState';
import Loading from './Loading';

export const TodoCaseDialog = ({ onDismiss }) => {  // Destructured onDismiss
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(false);
  const [currentCase] = useGlobalState('currentCase');
  const [taskListsOptions, setTaskListsOptions] = React.useState([]);
  const [taskListId, setTaskListId] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [formDisabled, setFormDisabled] = React.useState(true);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const handleAdd = async () => {
    setInProgress(true);
    setFormDisabled(true);
    await addTodoItem(currentCase, taskListId?.toString());
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
    title: 'Add to Todo?',
    closeButtonAriaLabel: 'Close',
  };

  const handleTaskListChange = React.useCallback((event, option) => {
    setTaskListId(option?.key.toString());
  }, []);

  React.useEffect(() => {
    getTaskLists().then((taskLists) => {
      const options = taskLists.map(list => ({
        key: list.id,
        text: list.displayName,
      }));

      setIsLoaded(true);
      setTaskListsOptions(options);
      setFormDisabled(false);
    });
  }, []);

  return (
    <>
      <Dialog
        hidden={hideDialog}
        onDismiss={handleDismiss}
        dialogContentProps={dialogContentProps}
        modalProps={{ isBlocking: true }}
      >
        {isLoaded && (
          <ComboBox
            label="List"
            placeholder="Select a list"
            autoComplete="on"
            options={taskListsOptions}
            onChange={handleTaskListChange}
          />
        )}
        {!isLoaded && <Loading />}
        <div style={{ paddingTop: '1em' }}>
          {success && <MessageBar messageBarType={MessageBarType.success}>The task was added to To Do</MessageBar>}
          {inProgress && <ProgressIndicator description="Adding the task..." />}
        </div>
        <DialogFooter>
          <PrimaryButton onClick={handleAdd} text="Add" disabled={!taskListId || formDisabled} />
          <DefaultButton onClick={handleDismiss} text="Cancel" disabled={formDisabled} />
        </DialogFooter>
      </Dialog>
    </>
  );
};
export default TodoCaseDialog;